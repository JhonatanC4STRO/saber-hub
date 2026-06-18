# Módulo de Instituciones - Setup

## Pasos necesarios para activar el módulo

### 1. Crear migración Prisma

```bash
npx prisma migrate dev --name add_institucion_admin_y_invitacion_instructor
```

Esto creará la migración para:

- Agregar columna `institucion_id` a tabla `usuarios`
- Agregar tabla `tokens_invitacion_instructor`
- Agregar relación `admin` en tabla `instituciones`

### 2. Crear rol 'admin_institucional' en base de datos

Ejecutar en SQL o prisma studio:

```sql
INSERT INTO roles (id, nombre, descripcion)
VALUES (cuid(), 'admin_institucional', 'Administrador de institución');
```

O usar Prisma Studio:

```bash
npx prisma studio
```

### 3. Instalaciones npm si falta

```bash
npm install bcrypt
```

## Rutas implementadas

### APIs

- `POST /api/instituciones/admin/configurar` - Crear admin institucional
- `GET /api/instituciones/[id]` - Obtener institución
- `PATCH /api/instituciones/[id]` - Editar institución
- `POST /api/instituciones/[id]/invitar-instructor` - Invitar instructor
- `GET /api/instituciones/[id]/invitar-instructor` - Listar invitaciones
- `GET /api/instituciones/[id]/cursos` - Listar cursos institucionales
- `PATCH /api/instituciones/[id]/cursos/[cursoId]` - Aprobar/despublicar curso
- `GET /api/auth/me` - Obtener usuario autenticado

### Páginas

- `/instituciones/configurar?token=xyz` - Crear cuenta admin institucional
- `/instituciones/dashboard` - Panel principal
- `/instituciones/perfil` - Editar perfil institución
- `/instituciones/instructores` - Gestionar instructores
- `/instituciones/cursos` - Gestionar cursos

## Flujo de uso

1. **Solicitud de institución**: Usuario solicita en `/instituciones/registro`
2. **Aprobación**: Admin aprueba en `/admin/instituciones/solicitudes/[id]`
3. **Token enviado**: Se envía email con link a `/instituciones/configurar?token=xyz`
4. **Setup admin**: Admin crea su cuenta
5. **Dashboard**: Acceso a `/instituciones/dashboard`
6. **Invitar instructores**: Envía invitaciones en `/instituciones/instructores`
7. **Gestionar cursos**: Aprueba/despublica cursos en `/instituciones/cursos`

## Cambios en Prisma Schema

### Modelo Usuario

- Agregado: `institucionId` (opcional, para admin institucional)
- Nueva relación: `institucion` (relación uno a uno)
- Nueva relación: `instructoresInvitados` (relación uno a muchos)

### Modelo Institucion

- Nueva relación: `admin` (Usuario)
- Nueva relación: `tokensInstructores` (TokenInvitacionInstructor[])

### Nuevo modelo TokenInvitacionInstructor

- Para invitar instructores a una institución
- Contiene: token, institucionId, adminId, correo, expira, usado, creado

## Notas

- Cursos publicados por instituciones son siempre gratuitos (validar en UI de crear curso)
- Solo admin de institución puede editar, invitar instructores y aprobar cursos
- Tokens de invitación expiran en 7 días
- No hay estilos CSS complejos en frontend, solo inputs y botones básicos
