interface ModulePlaceholderProps {
  title: string;
  description: string;
  note?: string;
}

export function ModulePlaceholder({ title, description, note }: ModulePlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
        <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
          Módulo en preparación
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          {description}
        </p>
        {note ? (
          <p className="mt-5 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm leading-6 text-sky-200">
            {note}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm leading-6 text-slate-400">
        No se ha cargado información oficial en esta etapa. No se muestran efectos, reglas, erratas
        ni rulings ficticios.
      </div>
    </section>
  );
}
