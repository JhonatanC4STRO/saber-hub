export interface PartialScraperStats {
  encontrados: number;
  nuevos: number;
  actualizados: number;
  errores: number;
  detalleErrores?: string[];
}

export interface ScrapedCourse {
  titulo: string;
  descripcion?: string;
  fuenteUrl: string;
  codigoExterno: string; // Unique code to avoid duplicates
  duracionHoras?: number | null;
  nivel?: string | null; // Básico, Intermedio, Avanzado
  areaConocimiento?: string | null;
  imagenUrl?: string | null;
  fechaInicio?: Date | null;
  fechaCierre?: Date | null;
  modalidad?: string;
}

export interface ScraperAdapter {
  name: string;
  sourceKey: string;
  run(
    logId: string,
    onProgress: (stats: PartialScraperStats) => Promise<void>
  ): Promise<ScrapedCourse[]>;
}
