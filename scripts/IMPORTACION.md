# Importación administrativa en producción

Estos comandos usan `DATABASE_URL` y funcionan en vista previa por defecto. Solo
escriben cambios al añadir `--apply`. Ejecútalos desde la terminal del contenedor
web de Dokploy, nunca desde una terminal pública.

## Crear o promover un administrador

Para promover una cuenta existente:

```sh
npm run admin:create -- --email admin@saberhub.com
npm run admin:create -- --email admin@saberhub.com --apply
```

Para crear una cuenta nueva, define temporalmente la contraseña y proporciona los
datos requeridos:

```sh
export SABERHUB_ADMIN_PASSWORD='CambiaEsta123!'
npm run admin:create -- --email admin@saberhub.com --nombre "Administrador" --documento 100000000 --apply
unset SABERHUB_ADMIN_PASSWORD
```

## Importar usuarios

Admite CSV, XLSX y JSON. Copia `scripts/data/usuarios.ejemplo.csv`, reemplaza sus
datos y ejecuta:

```sh
npm run users:import -- --file scripts/data/usuarios.csv
npm run users:import -- --file scripts/data/usuarios.csv --apply
```

Columnas disponibles: `nombre`, `email`, `documento`, `rol`, `password`,
`telefono`, `activo` y `verificado`. Los roles aceptados son `admin`,
`instructor` y `estudiante`. Una cuenta nueva necesita contraseña en su fila o en
la variable temporal `SABERHUB_DEFAULT_PASSWORD`.

El correo identifica al usuario. Una segunda ejecución actualiza la cuenta y no
la duplica. Una contraseña vacía conserva la contraseña de cuentas existentes.
Las celdas vacías de `telefono`, `activo` y `verificado` también conservan sus
valores al actualizar; al crear, `activo` vale `true` y `verificado`, `false`.

## Importar cursos

Copia `scripts/data/cursos.ejemplo.json`, cambia los datos y valida primero:

```sh
npm run courses:import -- --file scripts/data/cursos.json
npm run courses:import -- --file scripts/data/cursos.json --apply
```

El instructor debe existir con rol `instructor` o `admin`. Si se indica
`institucionSlug`, la institución también debe existir. La identidad de un curso
es la combinación de `instructorEmail` y `titulo`; repetir el comando actualiza el
curso, sus módulos, lecciones y recursos.

Los módulos o lecciones que no aparezcan en una importación posterior se
conservan para evitar borrar accidentalmente progreso estudiantil. Los recursos
de las lecciones incluidas sí se reemplazan por la lista del JSON.

Antes de importar en producción, crea una copia de seguridad de PostgreSQL. No
guardes archivos reales con contraseñas dentro del repositorio.

## Crear contenido inicial completo

El comando `content:seed` crea una demostración lista para usar con dos
instructores, seis estudiantes, tres cursos publicados, portadas, módulos,
lecciones, recursos, evaluaciones e inscripciones. Primero ejecuta la vista
previa:

```sh
npm run content:seed
```

Para aplicarla, define una contraseña temporal que cumpla la política de
seguridad:

```sh
export SABERHUB_SEED_PASSWORD='CambiaEstaClave123!'
npm run content:seed -- --apply
unset SABERHUB_SEED_PASSWORD
```

Las cuentas nuevas reciben la contraseña temporal; las cuentas existentes
conservan su contraseña. Repetir el comando actualiza el contenido sin duplicarlo
y no reinicia progreso ni intentos de evaluación existentes.
