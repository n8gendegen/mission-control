import { loadCanonicalMemory } from '../scripts/memory-loader.mjs';

async function buildAgentContext() {
  // Load canonical memory first
  const canonicalDocs = await loadCanonicalMemory();
  
  let systemPrompt = '\n## Background Context:\n';
  
  canonicalDocs.forEach(doc => {
    systemPrompt += `\n### ${doc.path}:\n${doc.content}\n`;
  });

  // Add fallback Supabase memory
  systemPrompt += '\n## Operational Memory:\n' + await loadSupabaseMemory();

  return {
    systemPrompt,
    warnings: canonicalDocs.filter(d => !d.content).map(d => d.path)
  };
}