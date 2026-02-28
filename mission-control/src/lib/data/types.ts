export type TaskColumn = "backlog" | "in-progress" | "rev";

export type TaskRecord = {
  id: string;
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
