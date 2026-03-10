export type TaskStageDefinition = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  owners: string[];
  badgeClass: string;
  panelClass: string;
};

export const TASK_STAGE_DEFINITIONS: TaskStageDefinition[] = [
  {
    key: "spec",
    label: "Spec / Splitter",
    shortLabel: "Spec",
    description: "Scoping + briefs in progress",
    owners: ["Spl"],
    badgeClass: "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
    panelClass: "border-cyan-400/30 bg-cyan-400/5",
  },
  {
    key: "builder",
    label: "Build / Steve",
    shortLabel: "Build",
    description: "Implementation & PRs in flight",
    owners: ["St"],
    badgeClass: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100",
    panelClass: "border-fuchsia-400/30 bg-fuchsia-400/5",
  },
  {
    key: "intel",
    label: "Intel / Spy",
    shortLabel: "Intel",
    description: "Research + bounty sourcing",
    owners: ["Sp"],
    badgeClass: "border-amber-400/40 bg-amber-400/10 text-amber-100",
    panelClass: "border-amber-400/30 bg-amber-400/5",
  },
  {
    key: "ops",
    label: "Ops / Infra",
    shortLabel: "Ops",
    description: "Henry, Janet, Sweeper workload",
    owners: ["H", "J", "Sw"],
    badgeClass: "border-slate-400/40 bg-slate-400/10 text-slate-100",
    panelClass: "border-slate-400/30 bg-slate-400/5",
  },
];

export const STAGE_BY_OWNER: Record<string, TaskStageDefinition> = TASK_STAGE_DEFINITIONS.reduce(
  (acc, stage) => {
    stage.owners.forEach((owner) => {
      acc[owner] = stage;
    });
    return acc;
  },
  {} as Record<string, TaskStageDefinition>
);

export const STAGE_BY_KEY = TASK_STAGE_DEFINITIONS.reduce(
  (acc, stage) => {
    acc[stage.key] = stage;
    return acc;
  },
  {} as Record<string, TaskStageDefinition>
);

type StageInput = {
  ownerInitials?: string | null;
  columnId?: string | null;
  inputPayload?: unknown;
  lane?: string | null;
};

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      console.warn("Unable to parse task payload", err);
      return null;
    }
  }
  return null;
}

const defaultSpecStage = STAGE_BY_KEY["spec"];
const defaultBuilderStage = STAGE_BY_KEY["builder"];
const defaultOpsStage = STAGE_BY_KEY["ops"];
const defaultIntelStage = STAGE_BY_KEY["intel"];

export function determineStageFromTask(input: StageInput): TaskStageDefinition {
  const owner = input.ownerInitials ?? "";
  if (owner && STAGE_BY_OWNER[owner]) {
    return STAGE_BY_OWNER[owner];
  }

  const payload = parsePayload(input.inputPayload);
  const lane = (input.lane ?? "").toLowerCase();
  if (lane === "intel" || lane === "revenue lab") {
    return defaultIntelStage;
  }

  const hasSpec = Boolean(payload && (payload as Record<string, unknown>).splitter_spec);
  if (!hasSpec) {
    return defaultSpecStage;
  }

  if ((input.columnId ?? "") === "rev") {
    return defaultOpsStage;
  }

  return defaultBuilderStage;
}

export type StageSnapshot = {
  stages: Array<TaskStageDefinition & { count: number }>;
  total: number;
};
