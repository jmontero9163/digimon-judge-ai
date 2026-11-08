# Roadmap

## Etapa 1: esqueleto y validaciones

- Monorepo, configuración y CI.
- PWA base con router y páginas vacías.
- API Hono con health y rutas pendientes.
- Esquema D1 con Drizzle.
- Cloudflare Access preparado sin bypass.
- Capa de IA deshabilitada.
- Pruebas unitarias de contratos y validaciones.
- Documentación inicial.

## Etapa 2: fuentes, cartas e importación curada

- Registro de fuentes oficiales.
- Importador JSON/CSV con checksum y revisión.
- Búsqueda por nombre e identificador.
- Ficha de carta con texto oficial.
- Paginación y contratos de listado.
- Pruebas de importación y validación.

## Etapa 3: reglas, palabras clave y rulings

- Reglas versionadas.
- Definiciones de palabras clave.
- Rulings y erratas con procedencia.
- Búsqueda y filtros por estado.
- Historial visible de versiones.

## Etapa 4: motor determinista

- Comparación de DP y resolución de batallas.
- Interacciones entre efectos.
- Resultados con reglas y fuentes citadas.
- Separación estricta de respuestas de IA.
- Suite de pruebas por interacción autorizada.

## Etapa 5: mazos

- Constructor de mazos.
- Validación estructural.
- Análisis de composición.
- Almacenamiento local y, posteriormente, en cuenta.

## Etapa 6: administración y auditoría

- CRUD administrativo protegido.
- Sincronización de identidades de Cloudflare Access con D1.
- Roles y permisos.
- Historial de cambios completo.
- Publicación y revisión de contenido.

## Etapa 7: IA con Gemini

- Adaptador Gemini en `packages/ai`.
- Respuestas con citas obligatorias.
- Revisión humana de borradores.
- Límites, registro y evaluación de respuestas.
- Prohibición de publicar IA como contenido oficial.

## Etapa 8: PWA avanzada y despliegue

- Estrategias offline por tipo de contenido.
- Caché de lectura pública con allowlist.
- Iconos y metadatos definitivos.
- Configuración de Cloudflare Access y D1 remotas.
- Despliegue autorizado en Cloudflare.
- Monitoreo y rollback.
