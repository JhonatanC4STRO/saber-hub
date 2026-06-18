import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const cursoId = searchParams.get('cursoId');
    const grupoId = searchParams.get('grupoId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const usuarioId = searchParams.get('usuarioId');
    const format = searchParams.get('format') || 'excel'; // 'excel' o 'pdf'

    if (!cursoId) {
      return NextResponse.json({ message: 'cursoId es requerido' }, { status: 400 });
    }

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { 
        id: true, 
        titulo: true, 
        instructorId: true,
        instructor: { select: { nombre: true } }
      },
    });

    if (!curso) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar permisos del instructor
    if (payload.rol === 'instructor' && curso.instructorId !== payload.id) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    // Construir filtros de Inscripción
    const whereConditions = { cursoId };

    if (usuarioId) {
      whereConditions.usuarioId = usuarioId;
    } else if (grupoId) {
      // Obtener usuarios del grupo
      const miembros = await prisma.miembroGrupo.findMany({
        where: { grupoId },
        select: { usuarioId: true },
      });
      whereConditions.usuarioId = { in: miembros.map((m) => m.usuarioId) };
    }

    if (fechaInicio || fechaFin) {
      whereConditions.fechaInscripcion = {};
      if (fechaInicio) {
        whereConditions.fechaInscripcion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        whereConditions.fechaInscripcion.lte = new Date(fechaFin);
      }
    }

    // Buscar inscripciones con datos del alumno
    const inscripciones = await prisma.inscripcion.findMany({
      where: whereConditions,
      include: {
        usuario: { select: { id: true, nombre: true, email: true, documento: true } },
      },
      orderBy: { fechaInscripcion: 'desc' },
    });

    // Enriquecer datos de alumnos con calificaciones y tiempo formateado
    const data = [];
    for (const ins of inscripciones) {
      // Buscar intentos de examen finalizados de este usuario en este curso
      const intentos = await prisma.intentoExamen.findMany({
        where: {
          usuarioId: ins.usuarioId,
          estado: { in: ['finalizado', 'calificado'] },
          evaluacion: {
            OR: [{ cursoId }, { modulo: { cursoId } }],
          },
        },
        select: {
          puntaje: true,
          evaluacionId: true,
        },
      });

      // Calcular la mejor nota por cada evaluación diferente en el curso
      const maxScores = {};
      intentos.forEach((intento) => {
        const score = Number(intento.puntaje || 0);
        if (!maxScores[intento.evaluacionId] || score > maxScores[intento.evaluacionId]) {
          maxScores[intento.evaluacionId] = score;
        }
      });

      const scores = Object.values(maxScores);
      const promedio =
        scores.length > 0
          ? Math.round(scores.reduce((acc, val) => acc + val, 0) / scores.length)
          : 0;

      // Formatear tiempo conectado
      const segs = ins.tiempoConectado || 0;
      const hrs = Math.floor(segs / 3600);
      const mins = Math.floor((segs % 3600) / 60);
      const secs = segs % 60;
      const tiempoFormateado = `${hrs}h ${mins}m ${secs}s`;

      data.push({
        documento: ins.usuario.documento,
        nombre: ins.usuario.nombre,
        email: ins.usuario.email,
        estado: ins.estado,
        progreso: Number(ins.progreso),
        calificacionPromedio: promedio,
        tiempoConectado: tiempoFormateado,
        ultimoAcceso: ins.ultimoAcceso ? ins.ultimoAcceso.toLocaleString('es-CO') : 'Sin acceso',
        fechaInscripcion: ins.fechaInscripcion.toLocaleString('es-CO'),
      });
    }

    // ============================================================
    // EXPORTACIÓN A EXCEL
    // ============================================================
    if (format === 'excel') {
      const rowsHtml = data.map((item, index) => {
        const isEven = index % 2 === 0;
        const rowClass = isEven ? 'even' : 'odd';
        const progreso = `${item.progreso}%`;
        const nota = `${item.calificacionPromedio}%`;
        const estado = item.estado || 'activo';
        
        let estadoStyle = '';
        if (estado === 'activo') {
          estadoStyle = 'background-color: #DEF7EC; color: #03543F; border: 1px solid #BCF0DA;';
        } else if (estado === 'finalizado') {
          estadoStyle = 'background-color: #E1EFFE; color: #1E429F; border: 1px solid #C3DDFD;';
        } else if (estado === 'retirado') {
          estadoStyle = 'background-color: #FDE8E8; color: #9B1C1C; border: 1px solid #FBD5D5;';
        } else {
          estadoStyle = 'background-color: #F3F4F6; color: #374151; border: 1px solid #E5E7EB;';
        }

        return `
          <tr class="${rowClass}">
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center; mso-number-format:'\\@';">${item.documento || 'N/A'}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1F2937; mso-number-format:'\\@';">${item.nombre || 'N/A'}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; mso-number-format:'\\@';">${item.email || 'N/A'}</td>
            <td style="border: 1px solid #E5E7EB; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; text-align: center; font-weight: bold; ${estadoStyle}">${estado.toUpperCase()}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1F2937; text-align: center; font-weight: bold; mso-number-format:'0%';">${progreso}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1F2937; text-align: center; font-weight: bold; mso-number-format:'0%';">${nota}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center; mso-number-format:'\\@';">${item.tiempoConectado || '0h 0m 0s'}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center;">${item.ultimoAcceso || 'Sin acceso'}</td>
            <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center;">${item.fechaInscripcion || 'N/A'}</td>
          </tr>
        `;
      }).join('');

      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Métricas de Aprendices</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            .odd { background-color: #F9FAFB; }
            .even { background-color: #FFFFFF; }
          </style>
        </head>
        <body>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td colspan="9" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: bold; color: #1E40AF; padding: 12px 0 6px 0;">SaberHub - Reporte de Seguimiento y Progreso</td>
            </tr>
            <tr>
              <td colspan="9" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563;"><strong>Curso:</strong> ${curso?.titulo || ''}</td>
            </tr>
            <tr>
              <td colspan="9" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #6B7280; padding-bottom: 20px;"><strong>Fecha de Reporte:</strong> ${new Date().toLocaleString('es-CO')}</td>
            </tr>
            <tr>
              <td colspan="9" style="height: 12px;"></td>
            </tr>
            <thead>
              <tr>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Documento</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: left;">Nombre de Alumno</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: left;">Correo Electrónico</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Estado Inscripción</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Progreso (%)</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Nota Promedio (%)</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Tiempo Conectado</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Último Acceso</th>
                <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Fecha de Inscripción</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      return new NextResponse(template, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte_seguimiento_${cursoId}.xls"`,
        },
      });
    }

    // ============================================================
    // EXPORTACIÓN A PDF
    // ============================================================
    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([612, 792]); // Tamaño Carta vertical (8.5 x 11 pulgadas)
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const truncar = (str, len) => (str && str.length > len ? str.slice(0, len - 3) + '..' : str || '');

      // Dibujar cabecera corporativa de SaberHub
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width,
        height: 80,
        color: rgb(0.12, 0.25, 0.69), // Azul SaberHub #1E40AF
      });

      page.drawText('SABERHUB LMS', {
        x: 30,
        y: height - 35,
        size: 9,
        font: fontBold,
        color: rgb(0.6, 0.75, 1.0),
      });

      page.drawText('REPORTE DE SEGUIMIENTO Y PROGRESO', {
        x: 30,
        y: height - 55,
        size: 15,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Caja de resumen de metadatos con borde
      page.drawRectangle({
        x: 20,
        y: height - 150,
        width: width - 40,
        height: 55,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.88, 0.9, 0.93),
        borderWidth: 1,
      });

      // Contenido de la caja
      page.drawText('DETALLES DEL REPORTE', {
        x: 35,
        y: height - 112,
        size: 7.5,
        font: fontBold,
        color: rgb(0.4, 0.45, 0.55),
      });

      page.drawText('Curso:', {
        x: 35,
        y: height - 128,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
      page.drawText(truncar(curso.titulo, 55), {
        x: 75,
        y: height - 128,
        size: 9,
        font,
        color: rgb(0.2, 0.25, 0.35),
      });

      page.drawText('Instructor:', {
        x: 35,
        y: height - 141,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
      page.drawText(curso.instructor?.nombre || 'N/A', {
        x: 90,
        y: height - 141,
        size: 9,
        font,
        color: rgb(0.2, 0.25, 0.35),
      });

      page.drawText('Fecha:', {
        x: 340,
        y: height - 128,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
      page.drawText(new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO'), {
        x: 378,
        y: height - 128,
        size: 9,
        font,
        color: rgb(0.2, 0.25, 0.35),
      });

      page.drawText('Total Alumnos:', {
        x: 340,
        y: height - 141,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
      page.drawText(String(data.length), {
        x: 420,
        y: height - 141,
        size: 9,
        font: fontBold,
        color: rgb(0.12, 0.25, 0.69),
      });

      // Cabeceras: Nombre, Documento, Estado, Progreso, Nota, Conect., Último Acceso
      const cols = [
        { label: 'Alumno', x: 30 },
        { label: 'Documento', x: 170 },
        { label: 'Estado', x: 245 },
        { label: 'Progreso', x: 305 },
        { label: 'Nota', x: 370 },
        { label: 'Conect.', x: 425 },
        { label: 'Último Acceso', x: 505 },
      ];

      // Dibujar encabezados de tabla
      const yTableStart = height - 185;
      page.drawRectangle({
        x: 20,
        y: yTableStart,
        width: width - 40,
        height: 22,
        color: rgb(0.12, 0.25, 0.69), // Azul SaberHub
      });

      cols.forEach((col) => {
        page.drawText(col.label, {
          x: col.x,
          y: yTableStart + 7,
          size: 8.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      });

      let yRow = yTableStart - 30;
      let rowIdx = 0;

      for (const item of data) {
        // Paginación si sobrepasa la altura física de la hoja
        if (yRow < 65) {
          page = pdfDoc.addPage([612, 792]);
          
          // Encabezado de página secundaria
          page.drawRectangle({
            x: 0,
            y: height - 50,
            width,
            height: 50,
            color: rgb(0.12, 0.25, 0.69),
          });
          page.drawText('SABERHUB - REPORTE DE SEGUIMIENTO Y PROGRESO', {
            x: 30,
            y: height - 28,
            size: 9,
            font: fontBold,
            color: rgb(1, 1, 1),
          });
          page.drawText(`Curso: ${curso.titulo.toUpperCase()}`, {
            x: 30,
            y: height - 40,
            size: 8,
            font,
            color: rgb(0.9, 0.9, 0.9),
          });

          // Cabeceras de tabla
          const ySecTableStart = height - 85;
          page.drawRectangle({
            x: 20,
            y: ySecTableStart,
            width: width - 40,
            height: 22,
            color: rgb(0.12, 0.25, 0.69),
          });

          cols.forEach((col) => {
            page.drawText(col.label, {
              x: col.x,
              y: ySecTableStart + 7,
              size: 8.5,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
          });

          yRow = height - 115;
        }

        // Fondo cebra alternado
        if (rowIdx % 2 === 1) {
          page.drawRectangle({
            x: 20,
            y: yRow - 6,
            width: width - 40,
            height: 26,
            color: rgb(0.97, 0.98, 0.99),
          });
        }

        // Línea divisoria sutil
        page.drawLine({
          start: { x: 20, y: yRow - 6 },
          end: { x: width - 20, y: yRow - 6 },
          thickness: 0.5,
          color: rgb(0.93, 0.94, 0.96),
        });

        // 1. Alumno (Nombre y Email en dos líneas)
        page.drawText(truncar(item.nombre, 22), {
          x: 30,
          y: yRow + 10,
          size: 8,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        page.drawText(truncar(item.email, 26), {
          x: 30,
          y: yRow + 1,
          size: 6.5,
          font,
          color: rgb(0.45, 0.45, 0.5),
        });

        // 2. Documento
        page.drawText(item.documento || 'N/A', {
          x: 170,
          y: yRow + 5,
          size: 8,
          font,
          color: rgb(0.2, 0.25, 0.3),
        });

        // 3. Estado (Badge Pill de color)
        let badgeBg = rgb(0.95, 0.96, 0.98);
        let badgeText = rgb(0.3, 0.3, 0.3);
        const estado = item.estado || 'activo';
        
        if (estado === 'activo') {
          badgeBg = rgb(0.87, 0.97, 0.93);
          badgeText = rgb(0.01, 0.33, 0.25);
        } else if (estado === 'finalizado') {
          badgeBg = rgb(0.88, 0.94, 1.0);
          badgeText = rgb(0.12, 0.26, 0.62);
        } else if (estado === 'retirado') {
          badgeBg = rgb(0.99, 0.91, 0.91);
          badgeText = rgb(0.61, 0.11, 0.11);
        }
        
        page.drawRectangle({
          x: 242,
          y: yRow + 3,
          width: 52,
          height: 12,
          color: badgeBg,
        });

        const estadoTxt = estado.toUpperCase();
        const textLen = estadoTxt.length * 3.8;
        const textX = 242 + (52 - textLen) / 2;
        page.drawText(estadoTxt, {
          x: textX,
          y: yRow + 6,
          size: 6.5,
          font: fontBold,
          color: badgeText,
        });

        // 4. Progreso (Barra de progreso + % texto)
        const barWidth = 35;
        const barHeight = 4;
        const progressX = 305;
        const progressPercent = item.progreso || 0;
        
        page.drawRectangle({
          x: progressX,
          y: yRow + 9,
          width: barWidth,
          height: barHeight,
          color: rgb(0.9, 0.92, 0.95),
        });
        
        const filledWidth = (Math.min(progressPercent, 100) / 100) * barWidth;
        if (filledWidth > 0) {
          page.drawRectangle({
            x: progressX,
            y: yRow + 9,
            width: filledWidth,
            height: barHeight,
            color: progressPercent >= 100 ? rgb(0.1, 0.7, 0.4) : rgb(0.12, 0.4, 0.8),
          });
        }
        
        page.drawText(`${progressPercent}%`, {
          x: progressX,
          y: yRow + 1,
          size: 7.5,
          font: fontBold,
          color: progressPercent >= 100 ? rgb(0.05, 0.45, 0.25) : rgb(0.1, 0.1, 0.15),
        });

        // 5. Nota Promedio
        page.drawText(`${item.calificacionPromedio}%`, {
          x: 370,
          y: yRow + 5,
          size: 8,
          font: fontBold,
          color: item.calificacionPromedio >= 70 ? rgb(0.12, 0.4, 0.8) : rgb(0.8, 0.4, 0.1),
        });

        // 6. Tiempo Conectado
        const tConectado = item.tiempoConectado || '0h 0m';
        const parts = tConectado.split(' ');
        const tSimple = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : tConectado;
        page.drawText(tSimple, {
          x: 425,
          y: yRow + 5,
          size: 8,
          font,
          color: rgb(0.3, 0.3, 0.35),
        });

        // 7. Último Acceso
        const ultimoAccesoSimple =
          item.ultimoAcceso === 'Sin acceso' ? 'Sin acceso' : item.ultimoAcceso.split(',')[0];
        page.drawText(ultimoAccesoSimple, {
          x: 505,
          y: yRow + 5,
          size: 8,
          font,
          color: rgb(0.3, 0.3, 0.35),
        });

        yRow -= 26;
        rowIdx++;
      }

      // Pie de páginas (automatizado)
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const pageNum = i + 1;
        
        p.drawLine({
          start: { x: 30, y: 35 },
          end: { x: width - 30, y: 35 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        
        p.drawText('SaberHub LMS · Reporte Profesional de Seguimiento', {
          x: 30,
          y: 20,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        p.drawText(`Página ${pageNum} de ${pages.length}`, {
          x: width - 95,
          y: 20,
          size: 8,
          font: fontBold,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte_seguimiento_${cursoId}.pdf"`,
        },
      });
    }

    // ============================================================
    // PREVISUALIZACIÓN JSON
    // ============================================================
    if (format === 'json') {
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    return NextResponse.json({ message: 'Formato no soportado' }, { status: 400 });
  } catch (error) {
    console.error('[GET /api/reportes/exportar]', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al exportar el reporte.' },
      { status: 500 }
    );
  }
}
