/*
  Warnings:

  - You are about to drop the column `bloqueado_hasta` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `intentos_fallidos` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `ultimo_login_ip` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documento]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefono]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `documento` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "bloqueado_hasta",
DROP COLUMN "intentos_fallidos",
DROP COLUMN "ultimo_login_ip",
ADD COLUMN     "documento" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_key" ON "usuarios"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");
