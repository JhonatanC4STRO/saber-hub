-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "otorgaCertificado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "preguntas" ADD COLUMN     "patron_regex" TEXT,
ADD COLUMN     "respuesta_correcta" TEXT;

-- AlterTable
ALTER TABLE "respuestas_aprendiz" ADD COLUMN     "feedback_instructor" TEXT,
ADD COLUMN     "pendiente_revision" BOOLEAN NOT NULL DEFAULT false;
