-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'en_revision', 'aprobada', 'rechazada');

-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('borrador', 'publicado', 'archivado');

-- CreateEnum
CREATE TYPE "EstadoModulo" AS ENUM ('activo', 'oculto');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('pdf', 'video', 'audio', 'imagen', 'presentacion', 'enlace', 'otro');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('activo', 'inactivo', 'finalizado', 'retirado');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'desarrollo');

-- CreateEnum
CREATE TYPE "EstadoIntento" AS ENUM ('en_curso', 'finalizado', 'expirado', 'calificado');

-- CreateEnum
CREATE TYPE "EstadoCertificado" AS ENUM ('emitido', 'revocado');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('inscripcion', 'evaluacion', 'certificado', 'foro', 'mensaje', 'sistema', 'solicitud_instructor');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('programada', 'en_curso', 'finalizada', 'cancelada');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "rol_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "ultimo_login" TIMESTAMP(3),
    "ultimo_login_ip" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT,
    "logo_url" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_instructor" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "experiencia" TEXT,
    "url_curriculum" TEXT,
    "motivo_rechazo" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMP(3),
    "revisor_id" TEXT,

    CONSTRAINT "solicitudes_instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "institucion_id" TEXT,
    "categoria_id" TEXT,
    "instructor_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "img_portada" TEXT,
    "estado" "EstadoCurso" NOT NULL DEFAULT 'borrador',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoModulo" NOT NULL DEFAULT 'activo',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecciones" (
    "id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido_texto" TEXT,
    "url_video" TEXT,
    "duracion" INTEGER,
    "es_preview" BOOLEAN NOT NULL DEFAULT false,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" TEXT NOT NULL,
    "leccion_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRecurso" NOT NULL,
    "url_documento" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "progreso" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'activo',
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMP(3),

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_leccion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "leccion_id" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_completada" TIMESTAMP(3),

    CONSTRAINT "progreso_leccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT,
    "modulo_id" TEXT,
    "creador_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntaje_minimo" INTEGER NOT NULL DEFAULT 70,
    "duracion_minutos" INTEGER,
    "intentos_maximos" INTEGER NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "evaluacion_id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 1,
    "orden" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "texto_opcion" TEXT NOT NULL,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos_examen" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "evaluacion_id" TEXT NOT NULL,
    "estado" "EstadoIntento" NOT NULL DEFAULT 'en_curso',
    "puntaje" DECIMAL(5,2),
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "intentos_examen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_aprendiz" (
    "id" TEXT NOT NULL,
    "intento_id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "texto_respuesta" TEXT,
    "opcion_id" TEXT,
    "calificacion" DECIMAL(5,2),

    CONSTRAINT "respuestas_aprendiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificaciones" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "codigo_unico" TEXT NOT NULL,
    "hash_verificacion" TEXT NOT NULL,
    "url_pdf" TEXT,
    "estado" "EstadoCertificado" NOT NULL DEFAULT 'emitido',
    "motivo_revocacion" TEXT,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foros" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_foro" (
    "id" TEXT NOT NULL,
    "foro_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "padre_id" TEXT,
    "contenido" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_foro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_internos" (
    "id" TEXT NOT NULL,
    "remitente_id" TEXT NOT NULL,
    "destinatario_id" TEXT NOT NULL,
    "asunto" TEXT,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_lectura" TIMESTAMP(3),

    CONSTRAINT "mensajes_internos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT,
    "url_destino" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_videoconferencia" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "creador_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "url_reunion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "estado" "EstadoSesion" NOT NULL DEFAULT 'programada',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_videoconferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "tabla" TEXT,
    "registro_id" TEXT,
    "datos_antes" TEXT,
    "datos_despues" TEXT,
    "ip" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_rol_id_idx" ON "users"("rol_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "solicitudes_instructor_usuario_id_idx" ON "solicitudes_instructor"("usuario_id");

-- CreateIndex
CREATE INDEX "solicitudes_instructor_estado_idx" ON "solicitudes_instructor"("estado");

-- CreateIndex
CREATE INDEX "cursos_instructor_id_idx" ON "cursos"("instructor_id");

-- CreateIndex
CREATE INDEX "cursos_categoria_id_idx" ON "cursos"("categoria_id");

-- CreateIndex
CREATE INDEX "cursos_estado_idx" ON "cursos"("estado");

-- CreateIndex
CREATE INDEX "modulos_curso_id_idx" ON "modulos"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "modulos_curso_id_orden_key" ON "modulos"("curso_id", "orden");

-- CreateIndex
CREATE INDEX "lecciones_modulo_id_idx" ON "lecciones"("modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecciones_modulo_id_orden_key" ON "lecciones"("modulo_id", "orden");

-- CreateIndex
CREATE INDEX "recursos_leccion_id_idx" ON "recursos"("leccion_id");

-- CreateIndex
CREATE INDEX "inscripciones_usuario_id_idx" ON "inscripciones"("usuario_id");

-- CreateIndex
CREATE INDEX "inscripciones_curso_id_idx" ON "inscripciones"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_usuario_id_curso_id_key" ON "inscripciones"("usuario_id", "curso_id");

-- CreateIndex
CREATE INDEX "progreso_leccion_usuario_id_idx" ON "progreso_leccion"("usuario_id");

-- CreateIndex
CREATE INDEX "progreso_leccion_leccion_id_idx" ON "progreso_leccion"("leccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "progreso_leccion_usuario_id_leccion_id_key" ON "progreso_leccion"("usuario_id", "leccion_id");

-- CreateIndex
CREATE INDEX "evaluaciones_curso_id_idx" ON "evaluaciones"("curso_id");

-- CreateIndex
CREATE INDEX "evaluaciones_modulo_id_idx" ON "evaluaciones"("modulo_id");

-- CreateIndex
CREATE INDEX "preguntas_evaluacion_id_idx" ON "preguntas"("evaluacion_id");

-- CreateIndex
CREATE INDEX "opciones_pregunta_id_idx" ON "opciones"("pregunta_id");

-- CreateIndex
CREATE INDEX "intentos_examen_usuario_id_idx" ON "intentos_examen"("usuario_id");

-- CreateIndex
CREATE INDEX "intentos_examen_evaluacion_id_idx" ON "intentos_examen"("evaluacion_id");

-- CreateIndex
CREATE INDEX "respuestas_aprendiz_intento_id_idx" ON "respuestas_aprendiz"("intento_id");

-- CreateIndex
CREATE INDEX "respuestas_aprendiz_pregunta_id_idx" ON "respuestas_aprendiz"("pregunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificaciones_inscripcion_id_key" ON "certificaciones"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificaciones_codigo_unico_key" ON "certificaciones"("codigo_unico");

-- CreateIndex
CREATE INDEX "certificaciones_codigo_unico_idx" ON "certificaciones"("codigo_unico");

-- CreateIndex
CREATE INDEX "foros_curso_id_idx" ON "foros"("curso_id");

-- CreateIndex
CREATE INDEX "mensajes_foro_foro_id_idx" ON "mensajes_foro"("foro_id");

-- CreateIndex
CREATE INDEX "mensajes_foro_usuario_id_idx" ON "mensajes_foro"("usuario_id");

-- CreateIndex
CREATE INDEX "mensajes_internos_destinatario_id_idx" ON "mensajes_internos"("destinatario_id");

-- CreateIndex
CREATE INDEX "mensajes_internos_remitente_id_idx" ON "mensajes_internos"("remitente_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_idx" ON "notificaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- CreateIndex
CREATE INDEX "sesiones_videoconferencia_curso_id_idx" ON "sesiones_videoconferencia"("curso_id");

-- CreateIndex
CREATE INDEX "sesiones_videoconferencia_fecha_inicio_idx" ON "sesiones_videoconferencia"("fecha_inicio");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuario_id_idx" ON "logs_auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "logs_auditoria_fecha_idx" ON "logs_auditoria"("fecha");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_instructor" ADD CONSTRAINT "solicitudes_instructor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_instructor" ADD CONSTRAINT "solicitudes_instructor_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecciones" ADD CONSTRAINT "lecciones_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_leccion_id_fkey" FOREIGN KEY ("leccion_id") REFERENCES "lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_leccion" ADD CONSTRAINT "progreso_leccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_leccion" ADD CONSTRAINT "progreso_leccion_leccion_id_fkey" FOREIGN KEY ("leccion_id") REFERENCES "lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_examen" ADD CONSTRAINT "intentos_examen_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_examen" ADD CONSTRAINT "intentos_examen_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_aprendiz" ADD CONSTRAINT "respuestas_aprendiz_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intentos_examen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_aprendiz" ADD CONSTRAINT "respuestas_aprendiz_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_aprendiz" ADD CONSTRAINT "respuestas_aprendiz_opcion_id_fkey" FOREIGN KEY ("opcion_id") REFERENCES "opciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificaciones" ADD CONSTRAINT "certificaciones_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_foro" ADD CONSTRAINT "mensajes_foro_foro_id_fkey" FOREIGN KEY ("foro_id") REFERENCES "foros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_foro" ADD CONSTRAINT "mensajes_foro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_foro" ADD CONSTRAINT "mensajes_foro_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "mensajes_foro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_internos" ADD CONSTRAINT "mensajes_internos_remitente_id_fkey" FOREIGN KEY ("remitente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_internos" ADD CONSTRAINT "mensajes_internos_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_videoconferencia" ADD CONSTRAINT "sesiones_videoconferencia_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_videoconferencia" ADD CONSTRAINT "sesiones_videoconferencia_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
