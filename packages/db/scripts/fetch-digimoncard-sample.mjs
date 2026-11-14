#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://digimoncard.io/api-public/search';
const SERIES = 'Digimon Card Game';
const DEFAULT_CARD = 'BT1-010';
const SOURCE_STABLE_KEY = 'digimoncard-io';
const SOURCE_NAME = 'DigimonCard.io (API pública)';
const SOURCE_PUBLISHER = 'DigimonCard.io (Card Coder Studios)';
const SOURCE_URL = 'https://digimoncard.io/api-documentation/';
const FORMAT = 'digimon-judge-cards/v1';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function usage() {
  console.log(
    [
      'Uso: node packages/db/scripts/fetch-digimoncard-sample.mjs [CARD_ID] [--out <ruta>]',
      '',
      `Consulta una sola carta a la API pública de DigimonCard.io (por defecto ${DEFAULT_CARD})`,
      'y genera un JSON compatible con packages/db/scripts/import-cards.mjs.',
      'No descarga imágenes, no consulta el catálogo y no escribe en la base de datos.',
    ].join('\n'),
  );
}

function parseArgs(argv) {
  const options = { cardId: null, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else if (arg === '--out') {
      options.out = argv[++index] ?? null;
      if (!options.out) throw new Error('Falta la ruta después de --out.');
    } else if (arg.startsWith('--')) {
      throw new Error(`Opción desconocida: ${arg}`);
    } else if (options.cardId) {
      throw new Error(`Argumento inesperado: ${arg}`);
    } else {
      options.cardId = arg;
    }
  }
  return { ...options, cardId: (options.cardId ?? DEFAULT_CARD).toUpperCase() };
}

function optionalString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function optionalInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function formatOfficialText(card) {
  const sections = [
    { label: 'Main Effect', value: card.main_effect },
    { label: 'Source Effect', value: card.source_effect },
    { label: 'Alt Effect', value: card.alt_effect },
  ];
  const parts = [];
  for (const section of sections) {
    if (typeof section.value === 'string' && section.value.trim().length > 0) {
      parts.push(`${section.label}:\n${section.value}`);
    }
  }
  return parts.join('\n\n');
}

function convertCard(card) {
  const level = optionalInteger(card.level);
  const dp = optionalInteger(card.dp);
  const playCost = optionalInteger(card.play_cost);
  const evolutionCost = optionalInteger(card.evolution_cost);

  return {
    id: card.id,
    name: card.name,
    ...(optionalString(card.type) ? { cardType: card.type } : {}),
    ...(optionalString(card.color) ? { color: card.color } : {}),
    ...(level !== undefined ? { level } : {}),
    ...(dp !== undefined ? { dp } : {}),
    ...(playCost !== undefined ? { playCost } : {}),
    ...(evolutionCost !== undefined ? { evolutionCost } : {}),
    ...(optionalString(card.form) ? { form: card.form } : {}),
    ...(optionalString(card.attribute) ? { attribute: card.attribute } : {}),
    ...(optionalString(card.rarity) ? { rarity: card.rarity } : {}),
    officialText: formatOfficialText(card),
    status: 'pending',
    sourceLocator: `${API_URL}?card=${encodeURIComponent(card.id)}`,
  };
}

async function fetchCard(cardId) {
  const url = new URL(API_URL);
  url.searchParams.set('card', cardId);
  url.searchParams.set('series', SERIES);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DigimonJudgeAI-local-sample/0.1 (+https://digimoncard.io/api-documentation/)',
    },
    signal: AbortSignal.timeout(20000),
  });

  if (response.status === 429) {
    throw new Error('DigimonCard.io aplicó el límite de solicitudes (15 por 10 s). Detente y reintenta más tarde.');
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DigimonCard.io respondió ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('La API no devolvió un arreglo de cartas.');
  }

  const match = payload.find(
    (item) => item && String(item.id).toUpperCase() === cardId && item.series === SERIES,
  );
  if (!match) {
    throw new Error(`No se encontró la carta ${cardId} para la serie "${SERIES}".`);
  }
  if (!match.name) {
    throw new Error(`La carta ${cardId} no incluye nombre.`);
  }

  return match;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = await fetchCard(options.cardId);

  const retrievedAt = new Date().toISOString();
  const output = {
    format: FORMAT,
    source: {
      stableKey: SOURCE_STABLE_KEY,
      name: SOURCE_NAME,
      publisher: SOURCE_PUBLISHER,
      url: SOURCE_URL,
      official: false,
      kind: 'community',
      version: `api-sample-${retrievedAt.slice(0, 10)}`,
      title: `Muestra puntual de ${raw.id} vía API pública`,
      retrievedAt,
    },
    cards: [convertCard(raw)],
  };

  const safeId = raw.id.replace(/[^A-Za-z0-9._-]/g, '_');
  const outPath = options.out
    ? resolve(process.cwd(), options.out)
    : join(repoRoot, 'packages/db/imports/generated', `digimoncard-${safeId}.json`);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        archivo: outPath,
        carta: raw.id,
        nombre: raw.name,
        fuente: 'DigimonCard.io (comunitaria, no oficial)',
        imagenes: 'omitidas (no se descargan ni enlazan)',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
