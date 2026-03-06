export type WorkstreamId = "shorts" | "podcast";

export type ShortsStage =
  | "ideas"
  | "script"
  | "assets"
  | "edit"
  | "ready"
  | "scheduled"
  | "published";

export type PodcastStage =
  | "source"
  | "candidates"
  | "cutlist"
  | "edit"
  | "review"
  | "ready"
  | "scheduled"
  | "published";

export type ContentStage = ShortsStage | PodcastStage;

export type ContentChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ContentAssetLink = {
  label: string;
  url: string;
};

export type CutSegment = {
  start: string;
  end: string;
  note: string;
};

export type PublishTarget = {
  platform: "YouTube" | "TikTok" | "Reels" | "Shorts";
  scheduledAt?: string | null;
  publishedAt?: string | null;
  url?: string | null;
};

export type ContentItem = {
  id: string;
  workstream: WorkstreamId;
  stage: ContentStage;
  title: string;
  sourceType: "trend" | "topic" | "episode";
  sourceRef: string;
  owner: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  targetPublishDate?: string;
  nextAction: string;
  scriptText?: string;
  captionsText?: string;
  hashtags?: string[];
  description?: string;
  cutlist?: CutSegment[];
  assets?: ContentAssetLink[];
  publish?: PublishTarget;
  checklist: ContentChecklistItem[];
  approvalsRequired: boolean;
};

export type ColumnDefinition = {
  id: ContentStage;
  title: string;
};

export type WorkstreamConfig = {
  id: WorkstreamId;
  label: string;
  description: string;
  columns: ColumnDefinition[];
  editStages: ContentStage[];
  scheduledStage: ContentStage;
  publishedStage: ContentStage;
};

export const WORKSTREAM_CONFIG: Record<WorkstreamId, WorkstreamConfig> = {
  shorts: {
    id: "shorts",
    label: "Shorts (Virality)",
    description: "Trend-driven, high velocity vertical videos.",
    columns: [
      { id: "ideas", title: "Ideas" },
      { id: "script", title: "Script" },
      { id: "assets", title: "Assets" },
      { id: "edit", title: "Edit" },
      { id: "ready", title: "Ready" },
      { id: "scheduled", title: "Scheduled" },
      { id: "published", title: "Published" },
    ],
    editStages: ["script", "assets", "edit"],
    scheduledStage: "scheduled",
    publishedStage: "published",
  },
  podcast: {
    id: "podcast",
    label: "Podcast Clips (10–20m)",
    description: "Frontier tech podcast excerpts turned into episodes.",
    columns: [
      { id: "source", title: "Source Episodes" },
      { id: "candidates", title: "Clip Candidates" },
      { id: "cutlist", title: "Cutlist" },
      { id: "edit", title: "Edit" },
      { id: "review", title: "Review" },
      { id: "ready", title: "Ready" },
      { id: "scheduled", title: "Scheduled" },
      { id: "published", title: "Published" },
    ],
    editStages: ["candidates", "cutlist", "edit", "review"],
    scheduledStage: "scheduled",
    publishedStage: "published",
  },
};

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

export const contentItems: ContentItem[] = [
  {
    id: "shorts-001",
    workstream: "shorts",
    stage: "ideas",
    title: "AVAX giga pump narrative",
    sourceType: "trend",
    sourceRef: "CryptoTwitter trending",
    owner: "Ivy",
    priority: "high",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    targetPublishDate: daysFromNow(1),
    nextAction: "Lock final hook + CTA",
    scriptText: "Hook → Why Avalanche mempool is going parabolic → CTA to subscribe.",
    hashtags: ["#avalanch", "#defi", "#trading"],
    assets: [{ label: "Trend dashboard", url: "https://trend.run/avax" }],
    checklist: [
      { id: "hook", label: "Hook drafted", done: false },
      { id: "broll", label: "B-roll references", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "shorts-002",
    workstream: "shorts",
    stage: "script",
    title: "Spot BTC ETF net inflows",
    sourceType: "topic",
    sourceRef: "BlackRock 13F",
    owner: "Maya",
    priority: "medium",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    targetPublishDate: daysFromNow(2),
    nextAction: "Punch up CTA + add stat overlay",
    scriptText: "Hook: TradFi finally aping in → Value: $8.2B week → CTA: subscribe",
    captionsText: "TradFi can't stop buying BTC. Here's what it means...",
    hashtags: ["#bitcoin", "#etf", "#macro"],
    checklist: [
      { id: "script", label: "Narrative locked", done: true },
      { id: "cta", label: "CTA reviewed", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "shorts-003",
    workstream: "shorts",
    stage: "assets",
    title: "AI Agents trading options",
    sourceType: "trend",
    sourceRef: "TikTok sound #agentszn",
    owner: "Leo",
    priority: "high",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    targetPublishDate: daysFromNow(3),
    nextAction: "Render caption-safe overlays",
    assets: [
      { label: "Sound file", url: "https://assets.mc/agent-audio.mp3" },
      { label: "Storyboard", url: "https://assets.mc/agent-storyboard.pdf" },
    ],
    checklist: [
      { id: "sound", label: "Sound cleared", done: true },
      { id: "overlays", label: "Overlay templates", done: false },
    ],
    approvalsRequired: false,
  },
  {
    id: "shorts-004",
    workstream: "shorts",
    stage: "edit",
    title: "Solana NFT floor reset",
    sourceType: "trend",
    sourceRef: "Tensor analytics",
    owner: "Rae",
    priority: "medium",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(0.5),
    targetPublishDate: daysFromNow(1),
    nextAction: "Color grade + sound mix",
    captionsText: "SOL NFT floors got nuked... here's why that's bullish.",
    checklist: [
      { id: "rough-cut", label: "Rough cut", done: true },
      { id: "grade", label: "Color grade", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "shorts-005",
    workstream: "shorts",
    stage: "ready",
    title: "Base chain memecoin sprint",
    sourceType: "trend",
    sourceRef: "Dune dashboard",
    owner: "Ivy",
    priority: "low",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(0.2),
    targetPublishDate: daysFromNow(2),
    nextAction: "Awaiting approval for scheduling",
    description: "How Base chain memecoins are onboarding new wallets",
    publish: {
      platform: "Shorts",
      scheduledAt: daysFromNow(2),
    },
    checklist: [
      { id: "compliance", label: "Compliance note", done: true },
      { id: "thumb", label: "Thumbnail concept", done: true },
    ],
    approvalsRequired: true,
  },
  {
    id: "shorts-006",
    workstream: "shorts",
    stage: "scheduled",
    title: "ETH staking yield compression",
    sourceType: "topic",
    sourceRef: "Nansen",
    owner: "Maya",
    priority: "medium",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(0.1),
    targetPublishDate: daysFromNow(0.5),
    nextAction: "Confirm CTA overlays",
    publish: {
      platform: "Shorts",
      scheduledAt: daysFromNow(0.5),
    },
    checklist: [
      { id: "metadata", label: "Metadata locked", done: true },
      { id: "qc", label: "QC pass", done: true },
    ],
    approvalsRequired: true,
  },
  {
    id: "shorts-007",
    workstream: "shorts",
    stage: "published",
    title: "US Treasury buyback rumor",
    sourceType: "topic",
    sourceRef: "WSJ leak",
    owner: "Leo",
    priority: "medium",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(0.3),
    targetPublishDate: daysAgo(1),
    nextAction: "Monitor retention",
    publish: {
      platform: "Shorts",
      scheduledAt: daysAgo(1.2),
      publishedAt: daysAgo(1),
      url: "https://youtube.com/shorts/xyz",
    },
    checklist: [
      { id: "post", label: "Published", done: true },
    ],
    approvalsRequired: false,
  },
  {
    id: "pod-001",
    workstream: "podcast",
    stage: "source",
    title: "Autonomous Trading with Karpathy",
    sourceType: "episode",
    sourceRef: "The Frontier Pod #118",
    owner: "Rae",
    priority: "high",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    targetPublishDate: daysFromNow(4),
    nextAction: "Mark standout quotes",
    description: "Clip AI agents trading options in the next 18 months.",
    checklist: [
      { id: "listen", label: "Full listen", done: true },
      { id: "notes", label: "Time-stamp notes", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "pod-002",
    workstream: "podcast",
    stage: "candidates",
    title: "Builders vs Suits",
    sourceType: "episode",
    sourceRef: "Empire - Latest",
    owner: "Jules",
    priority: "medium",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    targetPublishDate: daysFromNow(5),
    nextAction: "Decide between 2 candidate clips",
    checklist: [
      { id: "clip-a", label: "Clip A annotated", done: true },
      { id: "clip-b", label: "Clip B annotated", done: false },
    ],
    approvalsRequired: false,
  },
  {
    id: "pod-003",
    workstream: "podcast",
    stage: "cutlist",
    title: "Elon's xAI reveal",
    sourceType: "episode",
    sourceRef: "All-In 170",
    owner: "Maya",
    priority: "high",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(0.5),
    targetPublishDate: daysFromNow(3),
    nextAction: "Finalize cutlist timestamps",
    cutlist: [
      { start: "00:01:14", end: "00:04:55", note: "context" },
      { start: "00:05:02", end: "00:09:44", note: "debate" },
    ],
    checklist: [
      { id: "context", label: "Context slide", done: true },
      { id: "debate", label: "Debate slide", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "pod-004",
    workstream: "podcast",
    stage: "edit",
    title: "Modular AI infra",
    sourceType: "episode",
    sourceRef: "Stratechery #42",
    owner: "Leo",
    priority: "medium",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(0.7),
    targetPublishDate: daysFromNow(2),
    nextAction: "Layer subtitles + lower thirds",
    checklist: [
      { id: "rough", label: "Rough cut", done: true },
      { id: "captions", label: "Captions", done: false },
    ],
    approvalsRequired: true,
  },
  {
    id: "pod-005",
    workstream: "podcast",
    stage: "review",
    title: "Tokenized Treasuries explainer",
    sourceType: "episode",
    sourceRef: "On The Brink",
    owner: "Ivy",
    priority: "low",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(0.4),
    targetPublishDate: daysFromNow(1),
    nextAction: "Needs Nate approval before Ready",
    checklist: [
      { id: "fact", label: "Facts verified", done: true },
      { id: "brand", label: "Brand check", done: true },
    ],
    approvalsRequired: true,
  },
  {
    id: "pod-006",
    workstream: "podcast",
    stage: "ready",
    title: "AI Safety vs Speed",
    sourceType: "episode",
    sourceRef: "Lex Friedman",
    owner: "Rae",
    priority: "high",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(0.3),
    targetPublishDate: daysFromNow(1),
    nextAction: "Schedule once legal sign-off",
    publish: {
      platform: "YouTube",
      scheduledAt: daysFromNow(1),
    },
    checklist: [
      { id: "legal", label: "Legal note", done: true },
      { id: "thumb", label: "Thumbnail", done: true },
    ],
    approvalsRequired: true,
  },
  {
    id: "pod-007",
    workstream: "podcast",
    stage: "scheduled",
    title: "How Stripe prices risk",
    sourceType: "episode",
    sourceRef: "Invest Like the Best",
    owner: "Jules",
    priority: "medium",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(0.2),
    targetPublishDate: daysFromNow(0.2),
    nextAction: "Prep publishing copy",
    publish: {
      platform: "YouTube",
      scheduledAt: daysFromNow(0.2),
    },
    approvalsRequired: true,
    checklist: [
      { id: "metadata-p", label: "Metadata", done: true },
    ],
  },
  {
    id: "pod-008",
    workstream: "podcast",
    stage: "published",
    title: "Inside BlackRock's AI team",
    sourceType: "episode",
    sourceRef: "Odd Lots",
    owner: "Maya",
    priority: "medium",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(0.9),
    targetPublishDate: daysAgo(0.5),
    nextAction: "Monitor watch time",
    publish: {
      platform: "YouTube",
      scheduledAt: daysAgo(1),
      publishedAt: daysAgo(0.5),
      url: "https://youtube.com/watch?v=blackrock-ai",
    },
    approvalsRequired: false,
    checklist: [{ id: "post", label: "Published", done: true }],
  },
];

export type ContentQueueItem = {
  id: string;
  itemId: string;
  action: string;
  instructions: string;
  priority: "urgent" | "normal";
  owner: string;
  stage: ContentStage;
};

export const contentQueue: ContentQueueItem[] = [
  {
    id: "queue-1",
    itemId: "shorts-001",
    action: "Write CTA variant",
    instructions: "Test a bolder CTA referencing $AVAX move.",
    priority: "urgent",
    owner: "Ivy",
    stage: "script",
  },
  {
    id: "queue-2",
    itemId: "pod-003",
    action: "Finalize cutlist",
    instructions: "Need firm timestamps for final export.",
    priority: "normal",
    owner: "Maya",
    stage: "cutlist",
  },
  {
    id: "queue-3",
    itemId: "shorts-004",
    action: "Sound design polish",
    instructions: "Add riser before CTA hit.",
    priority: "normal",
    owner: "Rae",
    stage: "edit",
  },
];

export type ContentApprovalRequest = {
  id: string;
  itemId: string;
  title: string;
  summary: string;
  stage: ContentStage;
  requestedBy: string;
  requestedAt: string;
};

export const contentApprovals: ContentApprovalRequest[] = [
  {
    id: "approval-1",
    itemId: "shorts-005",
    title: "Base chain memecoin sprint",
    summary: "Need approval to move from Ready → Scheduled.",
    stage: "ready",
    requestedBy: "Ivy",
    requestedAt: daysAgo(0.2),
  },
  {
    id: "approval-2",
    itemId: "pod-005",
    title: "Tokenized Treasuries",
    summary: "Legal + compliance complete. Awaiting publish go-ahead.",
    stage: "review",
    requestedBy: "Ivy",
    requestedAt: daysAgo(0.4),
  },
];

export type PublishingEntry = {
  id: string;
  itemId: string;
  title: string;
  platform: string;
  status: "scheduled" | "published";
  scheduledFor?: string;
  publishedAt?: string;
  url?: string;
};

export const contentPublishing: PublishingEntry[] = [
  {
    id: "pub-1",
    itemId: "shorts-006",
    title: "ETH staking yield compression",
    platform: "YouTube Shorts",
    status: "scheduled",
    scheduledFor: daysFromNow(0.5),
  },
  {
    id: "pub-2",
    itemId: "pod-007",
    title: "How Stripe prices risk",
    platform: "YouTube",
    status: "scheduled",
    scheduledFor: daysFromNow(0.2),
  },
  {
    id: "pub-3",
    itemId: "shorts-007",
    title: "US Treasury buyback rumor",
    platform: "YouTube Shorts",
    status: "published",
    publishedAt: daysAgo(1),
    url: "https://youtube.com/shorts/xyz",
  },
  {
    id: "pub-4",
    itemId: "pod-008",
    title: "Inside BlackRock's AI team",
    platform: "YouTube",
    status: "published",
    publishedAt: daysAgo(0.5),
    url: "https://youtube.com/watch?v=blackrock-ai",
  },
];
