# Arquitectura

## Vista general

Digimon Judge AI es un monorepo con una PWA React y un Worker de Cloudflare. En producción, el Worker sirve los assets de la PWA y atiende `/api/*`, manteniendo un único origen. En desarrollo se ejecutan dos procesos y Vite redirige `/api` al Worker.

```text
Navegador / PWA
      |
      | HTTPS
      v
Cloudflare Worker
  ├─ Assets estáticos de apps/web/dist
  ├─ /api/v1/health
  ├─ /api/v1/cards
  ├─ /api/v1/rules
  ├─ /api/v1/judge
  ├─ /api/v1/decks
  ├─ /api/v1/history
  └─ /api/v1/admin  -> Cloudflare Access
      |
      ├─ Cloudflare D1
      └─ Gemini (etapa futura, opcional)
```

## Capas

### `apps/web`

- React 19 + Vite.
- React Router para navegación.
- TanStack Query para estado remoto.
- Tailwind CSS 4.
- PWA con precache de assets y shell.
- No contiene reglas de negocio.

### `apps/api`

- Cloudflare Worker con Hono.
- Rutas modulares por dominio.
- Validación con `packages/contracts`.
- Acceso a D1 a través de repositorios (etapas posteriores).
- Middleware de seguridad, errores y autenticación administrativa.

### `packages/domain`

- Tipos y funciones puras.
- Estados, procedencia, validaciones y resultados de juicio.
- No depende de frameworks ni de la base de datos.
- Es la fuente de verdad para las invariantes del producto.

### `packages/contracts`

- Esquemas Zod y DTOs.
- Contratos de API y respuestas de error.
- Se comparten entre Worker y PWA.

### `packages/db`

- Esquema Drizzle para D1.
- Generación de migraciones SQL.
- No contiene lógica de negocio.

### `packages/ai`

- Interfaz `AiProvider`.
- Proveedor deshabilitado por defecto.
- Contrato de respuesta generada con citas y aviso de revisión.
- La integración con Gemini se añadirá en una etapa posterior.

## Flujo de una petición

1. La PWA llama a una ruta `/api/v1/*`.
2. El Worker aplica middlewares de request ID, cabeceras de seguridad y errores.
3. La ruta valida la entrada con `packages/contracts`.
4. Si es administrativa, verifica Cloudflare Access antes de continuar.
5. La ruta consulta D1 o el dominio puro.
6. La respuesta se valida y se devuelve como JSON.
7. La PWA no cachea respuestas de API en el service worker.

## Autenticación administrativa

- Se verifica `Cf-Access-Jwt-Assertion` con JWKS de Cloudflare Access.
- Se comprueban issuer y audience.
- Sin configuración, la API responde `503`.
- Sin token válido, responde `401`.
- Las respuestas administrativas llevan `Cache-Control: no-store, private`.
- No existe bypass local ni de producción.
- En una etapa posterior, la identidad de Access se sincronizará con `users` en D1.

## Separación de reglas deterministas e IA

- El motor determinista devuelve `deterministic` y debe citar reglas y fuentes.
- La IA devuelve `ai_generated`, con modelo, versión de prompt, citas y aviso.
- Si faltan datos, se devuelve `insufficient_information`.
- La IA nunca puede marcar una respuesta como `official`.
- Las respuestas generadas se revisan antes de publicar cualquier conclusión.

## PWA y caché

- Workbox precachea JS, CSS, HTML e iconos.
- `navigateFallbackDenylist` excluye `/api/`.
- No hay runtime caching de API en la Etapa 1.
- Cuando se añada caché de lectura pública, será una allowlist explícita de endpoints de solo lectura.
- Quedan excluidos siempre `/api/admin`, autenticación y respuestas privadas.

## Base de datos

- D1 mediante Drizzle.
- Migraciones generadas por drizzle-kit y aplicadas con Wrangler.
- Solo se valida la base local en Etapa 1.
- La procedencia se modela con `sources` y `sourceId` obligatorio en contenido normativo.
- `audit_log` es append-only.

## Despliegue futuro

No configurado en Etapa 1. La topología aprobada es un único Worker que sirve la PWA y la API bajo el mismo origen. El despliegue requerirá autorización explícita, configuración de Cloudflare Access y una D1 remota creada fuera de este repositorio.
