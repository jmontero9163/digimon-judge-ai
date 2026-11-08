# Política de fuentes

## Objetivo

Garantizar que toda información normativa mostrada por Digimon Judge AI sea verificable, trazable y distinguible de una interpretación.

## Jerarquía de fuentes

1. **Reglas oficiales y documentos publicados por el editor del juego.**
2. **Listado oficial de cartas y textos oficiales.**
3. **FAQ oficial.**
4. **Erratas oficiales.**
5. **Listas oficiales de restricciones o prohibiciones.**
6. **Interpretaciones internas de jueces**, marcadas como `interpretation`.
7. **Fuentes comunitarias**, nunca tratadas como oficiales.
8. **Notas internas**, marcadas como `internal` y no publicadas como regla.

## Reglas de incorporación

- No se agrega una carta, efecto, regla, errata o ruling sin fuente.
- El texto oficial se guarda literalmente.
- Cada importación registra URL, fecha de obtención, checksum y revisor.
- Las importaciones son curadas: un archivo JSON o CSV revisado, no scraping automático en la Etapa 1.
- Los cambios se registran en `audit_log`.
- Una erratas no sobrescribe silenciosamente el dato anterior: se registra el valor previo y el nuevo.

## Conflictos entre fuentes

Si dos fuentes difieren:

1. Prevalece la fuente oficial de mayor jerarquía y fecha más reciente.
2. Si el conflicto no se puede resolver, el caso queda en `pending`.
3. Se documenta el conflicto y las fuentes involucradas.
4. No se elige una interpretación y se presenta como oficial.

## Casos pendientes

Un caso pendiente:

- Se muestra como `pending`.
- Indica qué información falta.
- No genera una respuesta concluyente.
- Puede citar fuentes parciales, pero no afirmar una resolución oficial.

## IA y fundamentación

La IA solo podrá:

- Resumir información previamente almacenada y citada.
- Proponer una explicación marcada como borrador.
- Señalar información faltante.

La IA no podrá:

- Crear efectos o reglas.
- Cambiar el estado de un contenido a `official`.
- Publicar una respuesta sin citas.
- Ocultar incertidumbre.

Toda respuesta generada se almacena como `ai_drafts` con estado `generated`, `reviewed`, `rejected` o `superseded`, y requiere revisión humana antes de influir en contenido publicado.

## Actualizaciones

Cuando se publique una nueva versión de una regla o errata:

1. Se conserva la versión anterior como `superseded`.
2. Se registra la nueva versión.
3. Se actualizan los rulings afectados.
4. Se añade la entrada de auditoría.
5. Se marcan para revisión las interacciones relacionadas.

## Fuentes no permitidas como base normativa

- Foros, wikis o redes sociales sin respaldo oficial.
- Traducciones no verificadas.
- Inferencias del modelo de IA.
- Datos de prueba o ejemplos inventados.

Los datos de prueba solo pueden usarse en tests estructurales y nunca se cargan en la base de datos de la aplicación.
