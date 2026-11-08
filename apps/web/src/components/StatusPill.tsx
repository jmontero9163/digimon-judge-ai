interface StatusPillProps {
  label: string;
  tone: 'neutral' | 'success' | 'warning';
}

const toneClasses: Record<StatusPillProps['tone'], string> = {
  neutral: 'border-slate-700 bg-slate-800/80 text-slate-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
