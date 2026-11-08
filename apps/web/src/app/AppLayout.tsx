import { NavLink, Outlet } from 'react-router';
import { appText, modules } from '../lib/i18n/es';

function navLinkClass({ isActive }: { isActive: boolean }) {
  const base =
    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400';
  return isActive
    ? `${base} bg-sky-500/15 text-sky-300`
    : `${base} text-slate-400 hover:bg-slate-800/70 hover:text-slate-100`;
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <NavLink to="/" className="flex items-center gap-3 focus-visible:outline-none">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sm font-black tracking-tight text-sky-300">
                DJ
              </span>
              <span>
                <span className="block text-sm font-bold tracking-tight text-white sm:text-base">
                  {appText.name}
                </span>
                <span className="hidden text-xs text-slate-400 sm:block">{appText.tagline}</span>
              </span>
            </NavLink>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
              {appText.stage}
            </span>
          </div>

          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Navegación principal">
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            {modules.map((module) => (
              <NavLink key={module.path} to={module.path} className={navLinkClass}>
                {module.title}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/80 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        {appText.footer}
      </footer>
    </div>
  );
}
