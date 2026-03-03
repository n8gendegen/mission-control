type DataProvenanceCardProps = {
  latestDate: string | null;
};

export function DataProvenanceCard({ latestDate }: DataProvenanceCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
      <div className="text-white/80">Data provenance</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-white/60">
        <li>Provider exports stored in <code>data/usage/source/</code>.</li>
        <li>Agent attribution JSONL appended per call (agent, project, task).</li>
        <li>Daily aggregates rebuilt via <code>scripts/ingest-openai-usage.mjs</code>.</li>
      </ul>
      <div className="mt-3 text-xs text-white/40">
        Last ingested day: {latestDate ?? "n/a"}
      </div>
      <div className="mt-3 text-xs text-violet-200">
        See <code>docs/data-tab/README.md</code> for full ingestion + schema notes.
      </div>
    </div>
  );
}
