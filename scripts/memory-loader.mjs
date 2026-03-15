import { readFile } from 'fs/promises';

const CANONICAL_FILES = [
  'docs/memory/mission-control.md',
  'docs/memory/concierge.md',
  'docs/memory/youtube-engine.md',
  'docs/memory/atlas-agent-suite.md',
  'docs/memory/governance.md'
];

export async function loadCanonicalMemory() {
  const memory = [];
  
  for (const path of CANONICAL_FILES) {
    try {
      const content = await readFile(path, 'utf8');
      memory.push({ path, content });
    } catch (error) {
      console.warn(`⚠️ Missing canonical memory file: ${path}`);
    }
  }

  return memory;
}
