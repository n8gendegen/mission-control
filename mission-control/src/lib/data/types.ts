export type TaskColumn = "backlog" | "in-progress" | "rev";

export type TaskRecord = {
  id: string; // slug or friendly identifier
  rowId?: string; // Supabase UUID for writes
  column: TaskColumn;
  title: string;
  description: string;
  statusColor: string;
  ownerInitials: string;
  source: string;
  timeAgo: string;
};

export type ActivityRecord = {
  id: string;
  owner: string;
  text: string;
  timeAgo: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRecord = {
  id: string;
  rowId?: string;
  title: string;
  summary: string;
  technicalScope?: string | null;
  payoutUsd?: number | null;
  timeEstimateHoursMin?: number | null;
  timeEstimateHoursMax?: number | null;
  tokenEstimate?: number | null;
  tokenCostUsd?: number | null;
  expectedProfitUsd?: number | null;
  recommendation?: string | null;
  status: ApprovalStatus;
  listingUrl?: string | null;
  repoUrl?: string | null;
  createdAt?: string | null;
};
