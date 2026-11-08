# Modelo de dominio

## Principios

1. No inventar información oficial.
2. Toda afirmación normativa debe tener procedencia.
3. Separar regla oficial, interpretación y caso pendiente.
4. Separar resultado determinista de borrador de IA.
5. Mantener historial de cambios.

## Estados

| Estado           | Uso                                                           |
| ---------------- | ------------------------------------------------------------- |
| `official`       | Regla, ruling, errata o dato publicado por una fuente oficial |
| `interpretation` | Interpretación de jueces o del equipo, marcada como tal       |
| `pending`        | Caso no resuelto o información insuficiente                   |
| `superseded`     | Reemplazado por una versión o publicación posterior           |

## Procedencia

Toda entidad normativa tiene:

- `sourceId`: identificador de la tabla `sources`.
- `sourceKind`: tipo de fuente (`official_rules`, `official_cardlist`, `official_faq`, `official_errata`, `official_banlist`, `community`, `internal`).
- `url` cuando exista.
- `verifiedAt` cuando haya sido revisada.
- `version` o fecha de vigencia cuando aplique.

Una fuente oficial se identifica por `sourceKind` que comienza con `official_` y por el campo `official` de la tabla `sources`.

## Resultados de juicio

La unión discriminada `JudgementResult` tiene tres variantes:

### `deterministic`

- `status`: estado de la regla aplicada.
- `answer`: resolución.
- `citations`: fuentes citadas, mínimo una.
- `ruleIds`: reglas aplicadas, mínimo una.

Si el estado es `official`, las citas son obligatorias.

### `ai_generated`

- `status`: siempre `generated`.
- `citations`: mínimo una.
- `model`, `promptVersion`, `disclaimer`, `generatedAt`.

Nunca puede ser `official`.

### `insufficient_information`

- `status`: siempre `pending`.
- `missingInformation`: datos o fuentes faltantes.
- `citations`: puede estar vacío.

Se usa cuando no hay base suficiente para responder.

## Entidades principales

### Fuentes

- `sources`: registro de fuentes con tipo, URL, checksum y fecha de obtención.
- `source_aliases`: alias para búsqueda y conciliación.

### Cartas

- `card_sets`: expansiones o sets.
- `cards`: identidad, metadatos y texto oficial.
- `card_effects`: efectos separados por tipo (`main`, `inherited`, `security`, `alternate`, `other`).

### Reglas y conocimiento

- `keywords`: palabras clave y definiciones.
- `rules`: reglas versionadas por `stableKey` + `version`.
- `rulings`: preguntas y respuestas publicadas.
- `erratas`: cambios oficiales sobre campos de carta.
- `interactions`: resoluciones verificadas de interacciones.

### Usuarios y mazos

- `users`: roles `admin`, `judge`, `user`; estado `active` o `disabled`.
- `decks`: mazos con visibilidad `private`, `unlisted` o `public`.
- `deck_cards`: cartas por sección `main` o `egg`, con cantidad.

### Auditoría e IA

- `audit_log`: cambios administrativos append-only.
- `ai_drafts`: borradores generados con citas, estado de revisión y revisor.

## Invariantes

- No se guarda contenido normativo sin `sourceId`.
- Un resultado `official` debe tener al menos una cita con `sourceId`.
- Una respuesta de IA no puede tener estado `official`.
- Un caso sin información debe devolver `insufficient_information`.
- El texto oficial de una carta no se reescribe: las interpretaciones van separadas.
- Las cantidades de mazo deben ser enteros positivos.
