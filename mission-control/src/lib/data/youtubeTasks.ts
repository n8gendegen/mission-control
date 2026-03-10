import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../supabase/client";

export type YoutubeTaskRow = {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  owner_initials: string | null;
  column_id: string | null;
  project: string | null;
  lane: string | null;
  task_type: string | null;
  priority: string | null;
  video_slug: string | null;
  target_publish_at: string | null;
  youtube_video_id: string | null;
  youtube_url: string | null;
  asset_links: { label: string; url: string }[] | null;
  metrics: { ctr?: number; retention?: number; views?: number } | null;
};

const SELECT_FIELDS =
  "id, slug, title, description, owner_initials, column_id, project, lane, task_type, priority, video_slug, target_publish_at, youtube_video_id, asset_links, metrics";

export async function fetchYoutubeTasks(projectId: string): Promise<YoutubeTaskRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client as SupabaseClient)
    .from("tasks")
    .select(SELECT_FIELDS)
    .eq("project", projectId)
    .order("target_publish_at", { ascending: true });

  if (error) {
    console.error("Failed to load Youtube tasks:", error.message ?? error);
    return [];
  }

  return (data ?? []) as YoutubeTaskRow[];
}
