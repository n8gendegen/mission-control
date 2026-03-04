#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('Missing SUPABASE_DB_URL env.');
  process.exit(1);
}

const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

async function fetchApprovedApprovals() {
  const { rows } = await client.query(
    `select a.id, a.slug, a.title, a.summary, a.opportunity_id, a.task_slug,
            so.repo_full_name, so.issue_number, so.listing_url
       from approvals a
       left join spy_opportunities so on so.id = a.opportunity_id
      where a.status = $1
        and (a.task_slug is null or a.task_slug = '')`,
    ['approved']
  );
  return rows;
}

function buildTaskSlug(approvalSlug) {
  return approvalSlug.startsWith('approval-') ? approvalSlug.replace('approval-', 'task-approval-') : `task-${approvalSlug}`;
}

async function ensureTask(approval) {
  const taskSlug = buildTaskSlug(approval.slug);
  const description = approval.summary ?? '';
  const { rows } = await client.query(
    `insert into tasks (slug, title, description, column_id, status_color, owner_initials, source, project)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (slug) do update set
       title = excluded.title,
       description = excluded.description,
       column_id = excluded.column_id,
       owner_initials = excluded.owner_initials,
       source = excluded.source,
       project = excluded.project,
       updated_at = timezone('utc', now())
     returning id`,
    [
      taskSlug,
      approval.title,
      description,
      'in-progress',
      'bg-emerald-400',
      'Sp',
      'Bounty Lane',
      'Bounty Lane',
    ]
  );
  return { taskId: rows[0].id, taskSlug };
}

async function triggerWorkSession(task, approval) {
  await client.query(
    `insert into agent_work_sessions (task_id, task_slug, task_title, agent_name, status, metadata)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (task_id, agent_name) do update set
       status = excluded.status,
       metadata = excluded.metadata,
       updated_at = timezone('utc', now())`,
    [
      task.taskId,
      task.taskSlug,
      approval.title,
      'Spy',
      'triggered',
      JSON.stringify({ approval_id: approval.id, opportunity_id: approval.opportunity_id }),
    ]
  );
}

async function logActivity(task, approval) {
  const summary = `Bounty approved → queued: ${approval.title}`;
  await client.query(
    `insert into activity_log (event_type, source, actor, summary, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [
      'bounty_claim',
      'approval-dispatcher',
      'Spy',
      summary,
      'task',
      task.taskSlug,
      JSON.stringify({ approval_id: approval.id, opportunity_id: approval.opportunity_id, issue_url: approval.listing_url }),
    ]
  );
}

async function updateApproval(taskSlug, approvalId) {
  await client.query(
    `update approvals
        set task_slug = $1,
            status = 'in-progress',
            updated_at = timezone('utc', now())
      where id = $2`,
    [taskSlug, approvalId]
  );
}

async function main() {
  await client.connect();
  try {
    const approvals = await fetchApprovedApprovals();
    if (!approvals.length) {
      console.log('No newly approved bounties to dispatch.');
      return;
    }

    for (const approval of approvals) {
      const task = await ensureTask(approval);
      await triggerWorkSession(task, approval);
      await updateApproval(task.taskSlug, approval.id);
      await logActivity(task, approval);
      console.log(`Dispatched ${approval.slug} → ${task.taskSlug}`);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
