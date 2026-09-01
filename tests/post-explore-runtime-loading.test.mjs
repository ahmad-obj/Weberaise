import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const journeyPath = new URL('../src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx', import.meta.url);
const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const runtimePath = new URL('../src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts', import.meta.url);

test('post-EXPLORE heavy modules are behind one cached dynamic boundary', async () => {
  const [journey, shell, runtime] = await Promise.all([
    readFile(journeyPath, 'utf8'),
    readFile(shellPath, 'utf8'),
    readFile(runtimePath, 'utf8'),
  ]);

  for (const name of ['buildJourneyPath', 'createRibbonController', 'getJourneyRoute', 'revealJourneyStop']) {
    assert.doesNotMatch(journey, new RegExp(`import\\s+\\{[^}]*${name}[^}]*\\}\\s+from`));
  }
  assert.doesNotMatch(journey, /import ShutterText from ['"]@\/components\/ui\/shutter-text['"]/);
  assert.match(runtime, /import\(['"]\.\/buildJourneyPath['"]\)/);
  assert.match(runtime, /import\(['"]\.\/ribbonController['"]\)/);
  assert.match(runtime, /import\(['"]\.\/journeyRoute['"]\)/);
  assert.match(runtime, /import\(['"]\.\/questionReveal['"]\)/);
  assert.match(runtime, /import\(['"]@\/components\/ui\/shutter-text['"]\)/);
  assert.match(shell, /preloadPostExploreRuntime\(\)/);
});
