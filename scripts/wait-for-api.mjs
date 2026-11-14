const HEALTH_URL = process.env.API_HEALTH_URL ?? 'http://127.0.0.1:8787/api/v1/health';
const TIMEOUT_MS = Number(process.env.API_WAIT_TIMEOUT_MS ?? 60_000);
const INTERVAL_MS = 500;
const REQUEST_TIMEOUT_MS = 2_000;

const deadline = Date.now() + TIMEOUT_MS;

console.log(`Esperando a la API en ${HEALTH_URL}...`);

while (Date.now() < deadline) {
  try {
    const response = await fetch(HEALTH_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) {
      console.log('API disponible. Iniciando el frontend.');
      process.exit(0);
    }
  } catch {
    // El Worker aún no está listo; se reintenta hasta agotar el plazo.
  }

  await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
}

console.error(
  `La API no respondió en ${TIMEOUT_MS / 1_000} segundos. Inicia el frontend con "npm run dev -w @digimon/web" cuando esté disponible.`,
);
process.exit(1);
