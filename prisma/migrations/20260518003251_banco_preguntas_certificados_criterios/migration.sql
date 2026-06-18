-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "criterio_eval_aprobadas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "criterio_lecciones_min" INTEGER,
ADD COLUMN     "criterio_nota_global" INTEGER;

-- AlterTable
ALTER TABLE "evaluaciones" ADD COLUMN     "mostrar_respuestas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orden_aleatorio" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "categorias_banco" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creador_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_banco" (
    "id" TEXT NOT NULL,
    "creador_id" TEXT NOT NULL,
    "categoria_id" TEXT,
    "pregunta" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 1,
    "respuesta_correcta" TEXT,
    "patron_regex" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preguntas_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_banco" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "texto_opcion" TEXT NOT NULL,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opciones_banco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categorias_banco_creador_id_idx" ON "categorias_banco"("creador_id");

-- CreateIndex
CREATE INDEX "preguntas_banco_creador_id_idx" ON "preguntas_banco"("creador_id");

-- CreateIndex
CREATE INDEX "preguntas_banco_categoria_id_idx" ON "preguntas_banco"("categoria_id");

-- CreateIndex
CREATE INDEX "opciones_banco_pregunta_id_idx" ON "opciones_banco"("pregunta_id");

-- AddForeignKey
ALTER TABLE "categorias_banco" ADD CONSTRAINT "categorias_banco_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_banco" ADD CONSTRAINT "preguntas_banco_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_banco" ADD CONSTRAINT "preguntas_banco_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_banco" ADD CONSTRAINT "opciones_banco_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas_banco"("id") ON DELETE CASCADE ON UPDATE CASCADE;
