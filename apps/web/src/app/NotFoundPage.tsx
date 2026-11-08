import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">404</span>
      <h1 className="text-2xl font-bold text-white">Página no encontrada</h1>
      <p className="text-sm text-slate-400">La ruta solicitada no existe en esta aplicación.</p>
      <Link
        to="/"
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
