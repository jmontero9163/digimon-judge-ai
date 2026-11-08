# ADR 0001: monorepo, D1, Drizzle y Worker único

- Estado: aceptado
- Fecha: 2026-11-07

## Contexto

La aplicación debe funcionar como PWA en PC y Android, alojarse en Cloudflare, versionarse en GitHub y separar las reglas deterministas de las respuestas de IA. También debe incorporar cartas y reglas nuevas sin reescribir toda la aplicación.

## Decisiones

### Monorepo con npm workspaces

Se separan `apps/web`, `apps/api` y paquetes compartidos. npm workspaces evita dependencias entre capas y permite probar el dominio sin arrancar la interfaz ni el Worker.

### D1 con Drizzle ORM

D1 es la base aprobada. Drizzle ofrece tipos, esquema declarativo y migraciones SQL compatibles con el flujo de Wrangler. Las migraciones se generan con drizzle-kit y se aplican con Wrangler.

### Un Worker en producción, misma origen

La PWA y la API se sirven desde el mismo Worker. Esto evita CORS, simplifica las cookies y reduce la superficie de configuración. En desarrollo se usan dos procesos con proxy de Vite.

### Cloudflare Access para administración

Las rutas administrativas verifican JWT de Access con JWKS. No se implementa autenticación propia en el MVP ni bypass local. Los usuarios de la aplicación se añadirán después en D1.

### PWA sin caché de API

En la Etapa 1 el service worker solo precachea assets y shell. No cachea respuestas de API. Cuando se habilite caché de lectura pública, será una allowlist y excluirá siempre administración y contenido privado.

### Separación determinista / IA

El dominio devuelve resultados deterministas con fuentes. La IA devuelve borradores con citas y estado `generated`. Una respuesta de IA no puede marcarse como oficial.

### Importación curada

Las cartas y reglas se incorporan mediante archivos JSON/CSV revisados, con URL, checksum y fecha de obtención. No se usa scraping automático en la Etapa 1.

## Consecuencias

- El despliegue queda pendiente y requiere autorización.
- El repositorio no contiene credenciales ni bases remotas.
- La Etapa 1 no incluye datos de juego.
- La capa de IA puede evolucionar sin acoplarse a la API o a React.
- Las reglas de juego se podrán probar de forma aislada.
