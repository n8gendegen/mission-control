type Tone = "positive" | "negative" | "neutral" | undefined;

type SummaryCardProps = {
  title: string;
  value: string;
  secondary?: string;
  helper?: string;
  badgeLabel?: string;
  badgeTone?: Tone;
};

const toneClasses: Record<Exclude<Tone, undefined>, string> = {
  positive: "bg-emerald-500/15 text-emerald-300",
  negative: "bg-rose-500/15 text-rose-300",
  neutral: "bg-white/10 text-white",
};

export function SummaryCard({
  title,
  value,
  secondary,
  helper,
  badgeLabel,
  badgeTone,
}: SummaryCardProps) {
  const badgeClass = badgeTone ? toneClasses[badgeTone] : "bg-white/10 text-white/80";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20">
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{title}</span>
        {badgeLabel && <span className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}>{badgeLabel}</span>}
      </div>
      <div className="mt-4 text-2xl font-semibold text-white">{value}</div>
      {secondary && <div className="mt-1 text-sm text-white/70">{secondary}</div>}
      {helper && <div className="mt-3 text-xs uppercase tracking-wide text-white/40">{helper}</div>}
    </div>
  );
}
