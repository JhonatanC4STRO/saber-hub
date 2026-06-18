import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    if (payload?.rol !== 'admin') throw new Error();
  } catch {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { fuente = 'sena' } = await req.json().catch(() => ({}));

  const scraperMap: Record<string, string> = {
    sena: 'scripts/scraper-sena.ts',
    coursera: 'scripts/scraper-coursera.ts',
    unal: 'scripts/scraper-unal.ts',
    udea: 'scripts/scraper-udea.ts',
    edx: 'scripts/scraper-edx.ts',
    khanacademy: 'scripts/scraper-khanacademy.ts',
  };

  const scriptRel = scraperMap[fuente.toLowerCase()];
  if (!scriptRel) {
    return NextResponse.json({ message: `Fuente desconocida: ${fuente}` }, { status: 400 });
  }

  const cwd = process.cwd();
  const scriptAbs = path.join(cwd, scriptRel);

  const child = spawn(
    'npx',
    ['tsx', scriptAbs],
    {
      cwd,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
      shell: true,
    }
  );
  child.unref();

  const triggeredAt = new Date().toISOString();
  return NextResponse.json({ ok: true, fuente, triggeredAt });
}
