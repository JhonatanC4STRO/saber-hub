import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request, { params }) {
  try {
    const { codigo } = await params;

    const cert = await prisma.certificadoRuta.findUnique({
      where: { codigoUnico: codigo.toUpperCase() },
      include: {
        usuario: { select: { nombre: true, documento: true } },
        ruta: {
          select: {
            nombre: true,
            creador: { select: { nombre: true } },
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({ message: 'Certificado de ruta no encontrado' }, { status: 404 });
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
      borderColor: rgb(0.15, 0.45, 0.3),
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
    drawCenteredText(
      'CERTIFICADO DE RUTA DE FORMACIÓN',
      height - 120,
      fontBold,
      34,
      rgb(0.15, 0.45, 0.3)
    );

    // Subtitle
    drawCenteredText('Otorgado por SaberHub', height - 160, fontRegular, 16, rgb(0.4, 0.4, 0.4));

    // Awarded to
    drawCenteredText('Se otorga el presente certificado a:', height - 220, fontRegular, 18);
    drawCenteredText(cert.usuario.nombre, height - 270, fontBold, 32);
    if (cert.usuario.documento) {
      drawCenteredText(
        `Doc: ${cert.usuario.documento}`,
        height - 300,
        fontRegular,
        14,
        rgb(0.3, 0.3, 0.3)
      );
    }

    // Description
    drawCenteredText(
      'Por haber completado satisfactoriamente la Ruta de Formación:',
      height - 360,
      fontRegular,
      18
    );
    drawCenteredText(cert.ruta.nombre, height - 410, fontBold, 24);

    // Creator & Date
    const issueDate = new Date(cert.fechaEmision).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    page.drawText(`Creador de la Ruta: ${cert.ruta.creador?.nombre || 'SaberHub'}`, {
      x: 80,
      y: 100,
      size: 14,
      font: fontRegular,
    });
    page.drawText(`Fecha de Emisión: ${issueDate}`, {
      x: width - 280,
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

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // Return the PDF as a Response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CertificadoRuta_${cert.codigoUnico}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al generar PDF de certificado' }, { status: 500 });
  }
}
