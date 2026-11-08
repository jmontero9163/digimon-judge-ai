# AGENTS.md

Guía para agentes y colaboradores que trabajen en Digimon Judge AI.

## Objetivo del proyecto

Construir una PWA para consultar y administrar el Digimon Card Game físico. La aplicación debe separar la lógica determinista de las respuestas generadas por IA y conservar la trazabilidad de las fuentes oficiales.

## Estado actual

La Etapa 1 solo crea el esqueleto. No hay cartas, reglas, efectos, erratas ni rulings cargados. La IA está deshabilitada. No hay despliegue ni D1 remota.

No avances a la Etapa 2 sin autorización explícita.

## Reglas de dominio obligatorias

1. **Nunca inventes** cartas, efectos, reglas, erratas, rulings, fechas o identificadores oficiales.
2. Toda regla, ruling, errata o interacción debe referenciar `sourceId` y una fuente verificable.
3. Distingue siempre estos estados:
   - `official`: publicado o confirmado por una fuente oficial.
   - `interpretation`: interpretación de jueces o equipo, explícitamente marcada.
   - `pending`: caso no resuelto o información insuficiente.
   - `superseded`: reemplazado por una versión posterior.
4. El texto oficial de una carta se guarda literalmente. Las interpretaciones estructuradas van en campos separados y marcados.
5. Una respuesta de IA es siempre `ai_generated` / `generated`. Nunca puede presentarse como oficial.
6. Si falta información, devuelve `insufficient_information` en lugar de completar huecos.
7. Las pruebas de reglas de juego requieren una fuente oficial citada. No escribas tests que codifiquen reglas inventadas.

## Arquitectura

- `packages/domain` no puede importar React, Hono, Cloudflare, D1 ni código de aplicaciones.
- `packages/contracts` contiene Zod y DTOs compartidos. La API debe validar con estos contratos.
- `packages/db` contiene el esquema Drizzle. Las migraciones se generan con drizzle-kit.
- `packages/ai` define la interfaz de IA. No incluyas SDK ni llamadas reales hasta la etapa autorizada.
- `apps/api` es el Worker. No accedas a D1 desde el frontend.
- `apps/web` es la PWA. No dupliques reglas de negocio en la interfaz.

## Seguridad

- Nunca escribas claves API, tokens, cookies ni secretos en el repositorio.
- Los secretos locales van en `.dev.vars`, que está ignorado por Git.
- Las rutas administrativas usan Cloudflare Access. No agregues bypass de autenticación, ni siquiera en desarrollo.
- No configures CORS abierto.
- La PWA no debe cachear `/api/*`, respuestas autenticadas ni contenido administrativo.
- No ejecutes despliegues ni crees bases D1 remotas sin autorización explícita.

## Base de datos

- Genera migraciones con `npm run db:generate`.
- Aplica solo en local con `npm run db:migrate:local`.
- Verifica con `npm run db:check:local`.
- Nunca uses `--remote` ni `wrangler d1 create` sin autorización.
- Toda tabla sensible debe tener trazabilidad en `audit_log`.
- Los cambios de contenido deben ser revisables y reversibles.

## Flujo de trabajo

Antes de modificar código:

1. Inspecciona los archivos relevantes.
2. Identifica la capa correcta.
3. Comprueba si existe un contrato o tipo compartido.
4. Añade pruebas para reglas, validaciones e invariantes.

Antes de finalizar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Si una validación falla, corrígela antes de entregar. No ocultes errores pendientes.

## Pruebas

- Usa Vitest.
- Prueba funciones puras del dominio sin depender de red o D1.
- Para endpoints, usa `app.request` con un entorno falso.
- No agregues pruebas que afirmen reglas de juego sin una fuente oficial.
- Las pruebas de integración con D1 local se añadirán cuando existan repositorios reales.

## Estilo

- TypeScript estricto.
- Importaciones de tipos explícitas.
- Español para textos de interfaz y documentación.
- Mantén los textos centralizados en `apps/web/src/lib/i18n/es.ts`.
- No agregues comentarios salvo que aclaren una decisión no obvia.
- Ejecuta Prettier mediante `npm run format`.

## IA

- La interfaz vive en `packages/ai`.
- El proveedor por defecto es `DisabledAiProvider`.
- Cualquier respuesta generada debe incluir citas, modelo, versión de prompt y aviso de revisión.
- La IA no puede publicar contenido ni modificar el estado de una regla a `official`.
- Gemini se integrará en la Etapa 7 usando un secret de Cloudflare, nunca una clave en código.
