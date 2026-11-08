import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { StatusPill } from '../../components/StatusPill';
import { fetchHealth } from '../../lib/api/client';
import { appText, modules } from '../../lib/i18n/es';

export function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const apiLabel = health.isPending
    ? appText.apiChecking
    : health.isSuccess
      ? appText.apiConnected
      : appText.apiUnavailable;
  const apiTone = health.isSuccess ? 'success' : health.isPending ? 'neutral' : 'warning';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill label={appText.stage} tone="warning" />
          <StatusPill label={apiLabel} tone={apiTone} />
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
          {appText.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
          {appText.tagline}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          {appText.stageDescription}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Datos oficiales
            </p>
            <p className="mt-2 text-lg font-bold text-white">Sin cargar</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              No se incluyen cartas ni reglas ficticias.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">IA</p>
            <p className="mt-2 text-lg font-bold text-white">Deshabilitada</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{appText.aiStatus}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Administración
            </p>
            <p className="mt-2 text-lg font-bold text-white">Cloudflare Access</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Rutas administrativas protegidas, sin bypass.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{appText.modulesTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{appText.modulesDescription}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.path}
              to={module.path}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-slate-900"
            >
              <h3 className="font-semibold text-white group-hover:text-sky-300">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
              <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-sky-400">
                Ver módulo
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-bold text-white">{appText.sourcesTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          {appText.sourcesDescription}
        </p>
        <p className="mt-4 max-w-3xl rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          {appText.dataPolicy}
        </p>
      </section>
    </div>
  );
}
