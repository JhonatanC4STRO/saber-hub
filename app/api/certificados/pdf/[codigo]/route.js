import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function GET(request, { params }) {
  const { codigo } = await params;

  const cert = await prisma.certificacion.findUnique({
    where: { codigoUnico: codigo.toUpperCase() },
    include: {
      inscripcion: {
        include: {
          usuario: { select: { nombre: true, documento: true } },
          curso: {
            select: {
              titulo: true,
              instructor: { select: { nombre: true } },
              institucion: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  if (!cert) {
    return NextResponse.json({ message: 'Certificado no encontrado' }, { status: 404 });
  }

  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();

  // Embed standard fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add a blank page (landscape)
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  // Draw border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.1, 0.2, 0.5),
    borderWidth: 5,
  });

  // Helper to draw centered text
  const drawCenteredText = (text, y, font, size, color = rgb(0, 0, 0)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  // Title
  drawCenteredText('CERTIFICADO DE FINALIZACIÓN', height - 120, fontBold, 36, rgb(0.1, 0.2, 0.5));

  // Subtitle
  const institucionText = cert.inscripcion.curso.institucion?.nombre
    ? `Otorgado por SaberHub y ${cert.inscripcion.curso.institucion.nombre}`
    : 'Otorgado por SaberHub';
  drawCenteredText(institucionText, height - 160, fontRegular, 16, rgb(0.4, 0.4, 0.4));

  // Awarded to
  drawCenteredText('Se otorga el presente certificado a:', height - 220, fontRegular, 18);
  drawCenteredText(cert.inscripcion.usuario.nombre, height - 270, fontBold, 32);
  if (cert.inscripcion.usuario.documento) {
    drawCenteredText(
      `Doc: ${cert.inscripcion.usuario.documento}`,
      height - 300,
      fontRegular,
      14,
      rgb(0.3, 0.3, 0.3)
    );
  }

  // Description
  drawCenteredText(
    'Por haber completado satisfactoriamente el curso:',
    height - 360,
    fontRegular,
    18
  );
  drawCenteredText(cert.inscripcion.curso.titulo, height - 410, fontBold, 24);

  // Instructor & Date
  const issueDate = new Date(cert.fechaEmision).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  page.drawText(`Instructor: ${cert.inscripcion.curso.instructor.nombre}`, {
    x: 80,
    y: 100,
    size: 14,
    font: fontRegular,
  });
  page.drawText(`Fecha: ${issueDate}`, {
    x: width - 250,
    y: 100,
    size: 14,
    font: fontRegular,
  });

  // Verification code
  drawCenteredText(
    `Código de Verificación: ${cert.codigoUnico}`,
    60,
    fontRegular,
    10,
    rgb(0.5, 0.5, 0.5)
  );

  // Protocol / URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saberhub.com';
  drawCenteredText(
    `Verificar en: ${baseUrl}/certificados/verificar/${cert.codigoUnico}`,
    45,
    fontRegular,
    10,
    rgb(0.2, 0.2, 0.8)
  );

  // Add revoked watermark if applicable
  if (cert.estado === 'revocado') {
    page.drawText('REVOCADO', {
      x: width / 2 - 250,
      y: height / 2 - 100,
      size: 100,
      font: fontBold,
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.3,
      rotate: degrees(45), // Approx 45 degrees
    });
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  // Return the PDF as a Response
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Certificado_${cert.codigoUnico}.pdf"`,
    },
  });
}
