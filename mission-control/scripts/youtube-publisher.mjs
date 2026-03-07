#!/usr/bin/env node
import { google } from "googleapis";
import { Pool } from "pg";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { logActivity } from "../shared/log-activity.js";

const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"];
const missing = required.filter((key) => !process.env[key]);
const taskSlug = process.argv[2] || "task-yt-publish-sora";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL env");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
let currentVideoSlug = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function logStatus(eventType, summary, metadata = {}) {
  await logActivity({
    eventType,
    summary,
    actor: "YouTubePublisher",
    source: "publisher-runner",
    entityType: "task",
    entityId: taskSlug,
    metadata,
  });
}

async function updateTask(youtubeVideoId, youtubeUrl, status = "published") {
  await pool.query(
    `update tasks
      set lane = case when $3 = 'published' then 'published' else lane end,
          status = $3,
          youtube_video_id = $1,
          youtube_url = $2,
          description = case when $3 = 'published'
            then 'Published via auto-publisher'
            else description end,
          updated_at = timezone('utc', now())
      where slug = $4`,
    [youtubeVideoId, youtubeUrl, status, taskSlug]
  );
}

async function fetchTask(slug) {
  const { rows } = await pool.query(
    "select slug, video_slug, asset_links from tasks where slug=$1",
    [slug]
  );
  if (!rows.length) {
    throw new Error(`Task ${slug} not found`);
  }
  return rows[0];
}

function pickAssetLink(assetLinks = [], pattern) {
  return assetLinks.find((link) => pattern.test(link.label) || pattern.test(link.url)) ?? null;
}

async function downloadFile(url, tmpDir, filename) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const target = path.join(tmpDir, filename);
  const readable = Readable.fromWeb(res.body);
  const fileStream = createWriteStream(target);
  await pipeline(readable, fileStream);
  return target;
}

function slugBase(videoSlug) {
  if (!videoSlug) return null;
  const parts = videoSlug.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return parts[0];
}

async function loadPackagingBrief(videoSlug) {
  const base = slugBase(videoSlug);
  if (!base) {
    throw new Error("Cannot derive packaging brief path without video_slug");
  }
  const docPath = path.resolve(__dirname, "..", "..", "docs", "youtube", `yt-packaging-${base}.md`);
  const content = await fs.readFile(docPath, "utf8");

  const titleMatch = content.match(/\*\*Chosen title:\*\*\s*(?:“|")([^”\"]+)(?:”|")/);
  const title = titleMatch?.[1]?.trim() || `YouTube Upload — ${videoSlug}`;

  const descriptionBlock = content.match(/```([\s\S]*?)```/);
  let description = descriptionBlock ? descriptionBlock[1].trim() : "";
  const hashtagsMatch = content.match(/Include hashtags:\s*`([^`]+)`/);
  if (hashtagsMatch) {
    description = `${description}\n\n${hashtagsMatch[1]}`;
  }

  const tagsMatch = content.match(/## Tags[\s\S]*?`([^`]+)`/);
  const tags = tagsMatch ? tagsMatch[1].split(",").map((tag) => tag.trim()).filter(Boolean) : [];

  return { title, description, tags };
}

async function appendBlockerNote(videoSlug, message) {
  const base = slugBase(videoSlug) ?? "sora";
  const blockerPath = path.resolve(__dirname, "..", "..", "docs", "youtube", "blockers", `yt-publish-${base}.md`);
  const note = `\n\n### ${new Date().toISOString()}\n${message}`;
  try {
    await fs.appendFile(blockerPath, note, "utf8");
  } catch (error) {
    console.warn(`Failed to append blocker note: ${error.message}`);
  }
}

async function run() {
  if (missing.length) {
    const reason = `Missing YouTube secrets: ${missing.join(", ")}`;
    console.error(reason);
    await logStatus("video_schedule_blocked", reason, { missing });
    process.exit(1);
  }

  let tmpDir;
  try {
    const task = await fetchTask(taskSlug);
    currentVideoSlug = task.video_slug;
    const packaging = await loadPackagingBrief(task.video_slug);
    const videoLink = pickAssetLink(task.asset_links, /mp4|video/i);
    const thumbLink = pickAssetLink(task.asset_links, /thumb|jpg|png/i);

    if (!videoLink) throw new Error("No video asset_link found for publish task");
    if (!thumbLink) throw new Error("No thumbnail asset_link found for publish task");

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-publisher-"));
    const fallbackSlug = task.slug ?? taskSlug;
    const videoPath = await downloadFile(videoLink.url, tmpDir, `${fallbackSlug}.mp4`);
    const thumbPath = await downloadFile(thumbLink.url, tmpDir, `${fallbackSlug}.jpg`);

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const insertResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: packaging.title,
          description: packaging.description,
          tags: packaging.tags,
        },
        status: {
          privacyStatus: "unlisted",
        },
      },
      media: {
        body: createReadStream(videoPath),
      },
    });

    const youtubeVideoId = insertResponse.data.id;
    if (!youtubeVideoId) {
      throw new Error("YouTube API did not return a video ID");
    }

    try {
      await youtube.thumbnails.set({
        videoId: youtubeVideoId,
        media: {
          mimeType: "image/jpeg",
          body: createReadStream(thumbPath),
        },
      });
    } catch (thumbError) {
      console.warn("Thumbnail upload failed", thumbError.message);
      await logStatus("video_thumbnail_failed", thumbError.message, { youtubeVideoId });
    }

    const youtubeUrl = `https://youtu.be/${youtubeVideoId}`;
    await updateTask(youtubeVideoId, youtubeUrl, "published", "published");
    await logStatus("video_published", `Published ${taskSlug}`, {
      youtubeVideoId,
      youtubeUrl,
      videoSlug: task.video_slug,
    });

    console.log(`Published ${taskSlug} → ${youtubeUrl}`);
  } catch (error) {
    console.error("Publisher runner failed", error);
    await updateTask(null, null, "blocked", "scheduled");
    await appendBlockerNote(error.video_slug ?? "sora-breaks-hollywood", error.message);
    await logStatus("video_schedule_blocked", error.message, { stack: error.stack });
    process.exit(1);
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
    await pool.end();
  }
}

run();
