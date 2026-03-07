#!/usr/bin/env node
import { logActivity } from "../shared/log-activity.js";

const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"];
const missing = required.filter((key) => !process.env[key]);

const taskSlug = process.argv[2] || "task-yt-publish-sora";

async function logBlocker(reason) {
  await logActivity({
    eventType: "video_schedule_blocked",
    summary: `Publish blocked for ${taskSlug}`,
    actor: "PublisherRunner",
    source: "publisher-runner",
    entityType: "task",
    entityId: taskSlug,
    metadata: { reason, missing },
  });
}

(async function main() {
  if (missing.length) {
    const reason = `Missing YouTube secrets: ${missing.join(", ")}`;
    console.error(reason);
    await logBlocker(reason);
    process.exit(1);
  }

  console.log("YouTube secrets detected — hook up API flow here.");
})();
