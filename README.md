# Digimon Judge AI

PWA para consultar y administrar el Digimon Card Game físico, con reglas deterministas separadas de las respuestas generadas por IA y referencias obligatorias a fuentes oficiales.

## Estado: Etapa 1

Esta etapa crea el esqueleto del proyecto, la configuración del monorepo, los contratos compartidos, el esquema D1, la API base y la PWA. **No incluye datos oficiales de cartas, reglas, efectos, erratas ni rulings.** Tampoco hay despliegue ni bases de datos remotas.

La Etapa 1 incluye:

- Monorepo con npm workspaces.
- React 19, TypeScript 5.9, Vite 8 y Tailwind CSS 4.
- PWA instalable con service worker que no cachea respuestas de API.
- Cloudflare Worker con Hono y rutas base.
- Esquema Drizzle para D1 y migración local.
- Cloudflare Access preparado para proteger la administración, sin bypass.
- Capa de IA deshabilitada y desacoplada, lista para integrar Gemini más adelante.
- Pruebas unitarias de validaciones, estados y contratos.
- Documentación de arquitectura, modelo de dominio, fuentes y roadmap.

## Stack

| Área                | Tecnología                                       |
| ------------------- | ------------------------------------------------ |
| Frontend            | React 19, React Router 7, TanStack Query, Vite 8 |
| Estilos             | Tailwind CSS 4                                   |
| PWA                 | `vite-plugin-pwa` 2 + Workbox                    |
| Backend             | Cloudflare Workers, Hono 4                       |
| Base de datos       | Cloudflare D1                                    |
| ORM y migraciones   | Drizzle ORM + drizzle-kit                        |
| Validación          | Zod 4                                            |
| Autenticación admin | Cloudflare Access (JWT/JWKS)                     |
| Pruebas             | Vitest 4.1                                       |
| IA                  | Interfaz propia; Gemini se integra después       |

## Requisitos

- Node.js `>=22.13.0` (probado con 22.14.0).
- npm `>=10`.
- Wrangler se instala como dependencia del monorepo.

## Instalación

```bash
npm install
npm run db:generate
npm run db:migrate:local
```

La migración se aplica únicamente a la base D1 local de Wrangler. No se crea ni modifica ninguna base remota.

## Desarrollo

```bash
npm run dev
```

El comando compila primero la PWA y luego inicia:

- `apps/web` en Vite, normalmente en `http://localhost:5173`.
- `apps/api` con `wrangler dev`, normalmente en `http://127.0.0.1:8787`.

Vite redirige `/api` al Worker local, por lo que frontend y API comparten origen durante el desarrollo. El build previo es necesario porque el Worker local sirve `apps/web/dist` como assets.

Si trabajas solo con la API, ejecuta `npm run build` al menos una vez y luego `npm run dev -w @digimon/api`.

## Validaciones

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

`npm run check` ejecuta lint, typecheck y pruebas. El build de la PWA se ejecuta por separado.

## Base de datos local

```bash
npm run db:generate      # Genera SQL a partir del esquema Drizzle
npm run db:migrate:local # Aplica migraciones en D1 local
npm run db:check:local   # Lista tablas de la base local
```

Nunca se debe ejecutar `wrangler d1 create`, `wrangler d1 migrations apply --remote` ni `wrangler deploy` sin autorización explícita.

## Variables y secretos

Copia los ejemplos solo en desarrollo local:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

Variables relevantes:

| Variable             | Ámbito        | Uso                                     |
| -------------------- | ------------- | --------------------------------------- |
| `VITE_API_BASE_URL`  | Frontend      | Base de la API; por defecto `/api/v1`   |
| `ACCESS_TEAM_DOMAIN` | Worker        | Dominio del equipo de Cloudflare Access |
| `ACCESS_AUD`         | Worker        | Audience del token de Access            |
| `AI_ENABLED`         | Worker        | Bandera de IA; `false` en Etapa 1       |
| `GEMINI_API_KEY`     | Worker secret | Se configurará en una etapa posterior   |

Nunca se versionan claves, tokens ni `.dev.vars`.

## Estructura

```text
apps/
  web/                  React + Vite + PWA
  api/                  Cloudflare Worker + Hono
packages/
  domain/               Reglas, estados y validaciones puras
  contracts/            Esquemas Zod y DTOs compartidos
  db/                   Esquema Drizzle y migraciones
  ai/                   Interfaz de IA y proveedor deshabilitado
docs/                   Arquitectura, dominio, fuentes y roadmap
```

## Seguridad y confianza

- Las rutas administrativas verifican JWT de Cloudflare Access con JWKS.
- Sin `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD`, la API administrativa responde `503`.
- Sin token válido, responde `401`. No existe bypass de desarrollo.
- La PWA solo cachea assets estáticos y el shell. No cachea `/api/*`, respuestas privadas ni administrativas.
- Las reglas oficiales, interpretaciones y casos pendientes se distinguen explícitamente.
- Las respuestas de IA se marcan como borradores generados y nunca como oficiales.
- Toda regla, ruling, errata o interacción debe referenciar una fuente.

## Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo de dominio](docs/domain-model.md)
- [Política de fuentes](docs/sources-policy.md)
- [Roadmap](docs/roadmap.md)
- [ADR 0001](docs/adr/0001-monorepo-d1-worker.md)

## Roadmap resumido

1. **Etapa 1**: esqueleto, configuración y validaciones.
2. **Etapa 2**: fuentes, cartas, importación curada y buscador.
3. **Etapa 3**: reglas, palabras clave y rulings.
4. **Etapa 4**: motor determinista de interacciones y efectos.
5. **Etapa 5**: constructor y analizador de mazos.
6. **Etapa 6**: administración, auditoría y usuarios.
7. **Etapa 7**: IA con Gemini, citas obligatorias y revisión humana.
8. **Etapa 8**: PWA offline avanzada y despliegue en Cloudflare.

No se avanza a la siguiente etapa sin autorización.
