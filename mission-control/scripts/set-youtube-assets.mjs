#!/usr/bin/env node
import { Pool } from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

const assetCatalog = {
  "sora-breaks-hollywood": {
    slugs: [
      "task-yt-assets-sora",
      "task-yt-packaging-sora",
      "task-yt-publish-sora",
    ],
    links: [
      {
        label: "Draft MP4",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/yt-sora.mp4",
      },
      {
        label: "Thumbnail",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/yt-sora-thumb.jpg",
      },
    ],
  },
  "ai-directors-union": {
    slugs: [
      "task-yt-assets-ai-directors",
      "task-yt-packaging-ai-directors",
      "task-yt-publish-ai-directors",
    ],
    links: [
      {
        label: "Draft MP4",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/yt-sora.mp4",
      },
      {
        label: "Thumbnail",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/yt-sora-thumb.jpg",
      },
    ],
  },

  "goalie-top-3-walls": {
    slugs: [
      "task-yt-assets-goalie-top-3-walls",
      "task-yt-packaging-goalie-top-3-walls",
      "task-yt-publish-goalie-top-3-walls",
    ],
    links: [
      {
        label: "Draft MP4",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/dryruns/goalie-top-3-walls.mp4",
      },
      {
        label: "Thumbnail",
        url: "https://dzmtdzfkhtnryhpkwfcd.supabase.co/storage/v1/object/public/youtube-drafts/dryruns/goalie-top-3-walls-thumb.png",
      },
    ],
  },
};

const videoSlug = process.argv[2] || "sora-breaks-hollywood";

async function main() {
  const config = assetCatalog[videoSlug];
  if (!config) {
    console.error(`No asset config for ${videoSlug}`);
    process.exit(1);
  }

  await pool.query(
    `update tasks set asset_links = $2 where slug = any($1::text[])`,
    [config.slugs, JSON.stringify(config.links)]
  );
  console.log(`Updated asset_links for ${config.slugs.join(", ")}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
