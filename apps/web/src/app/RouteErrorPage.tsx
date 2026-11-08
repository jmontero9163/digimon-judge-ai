import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'No se pudo cargar esta pantalla.';

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
      <h1 className="text-2xl font-bold text-white">Error de navegación</h1>
      <p className="text-sm text-rose-200">{message}</p>
      <Link
        to="/"
        className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
