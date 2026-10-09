import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;

const { WORKS_BRIDGE_ITEMS } = await import(
  moduleUrl('src/components/ServicesPage/worksBridgeModel.ts')
);

test('works teaser shares the three supplied portfolio previews', async () => {
  const { WORK_PROJECTS } = await import(moduleUrl('src/content/workProjects.ts'));
  assert.equal(WORKS_BRIDGE_ITEMS.length, WORK_PROJECTS.length);
  for (const [index, item] of WORKS_BRIDGE_ITEMS.entries()) {
    assert.equal(item.id, WORK_PROJECTS[index].slug);
    assert.equal(item.image, WORK_PROJECTS[index].media.poster);
    assert.equal(item.video, WORK_PROJECTS[index].media.teaserPreview);
  }
});

test('works bridge has exactly one portfolio navigation target', () => {
  const source = read('src/components/ServicesPage/WorksBridge.tsx');
  assert.equal((source.match(/href="\/work"/g) ?? []).length, 1);
});

test('drift wall alternates columns and pauses only the hovered column', async () => {
  const motion = await import(moduleUrl('src/components/ui/DriftWall/driftWallMotion.ts'));
  const velocities = [0, 1, 2].map((index) =>
    motion.getBaseVelocity(index, 30, 0.22, 'up'),
  );

  assert.ok(velocities[0] > 0);
  assert.ok(velocities[1] < 0);
  assert.ok(velocities[2] > 0);
  assert.notEqual(Math.abs(velocities[0]), Math.abs(velocities[2]));
  assert.equal(motion.getVelocityTarget(velocities[1], 1, 1), 0);
  assert.equal(motion.getVelocityTarget(velocities[0], 0, 1), velocities[0]);
  assert.equal(motion.getVelocityTarget(velocities[2], 2, 1), velocities[2]);
});

test('drift wall uses faster damping while stopping than while resuming', async () => {
  const { getVelocityEase } = await import(
    moduleUrl('src/components/ui/DriftWall/driftWallMotion.ts')
  );
  assert.ok(getVelocityEase(1 / 60, 0) > getVelocityEase(1 / 60, 30));
});

test('drift wall remains decorative and uses RAF/observer lifecycle', () => {
  const source = read('src/components/ui/DriftWall/DriftWall.tsx');
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /hoveredColRef/);
  assert.match(source, /getVelocityTarget/);
  assert.match(source, /alt=""/);
  assert.doesNotMatch(source, /role="button"/);
  assert.doesNotMatch(source, /tabIndex=\{?0\}?/);
  assert.doesNotMatch(source, /href=/);
});

test('drift wall uses a long symmetric vertical dissolve and vivid active tile', () => {
  const css = read('src/components/ui/DriftWall/DriftWall.module.css');
  assert.match(css, /mask-image:\s*linear-gradient\(\s*to bottom/);
  assert.match(css, /transparent 0%/);
  assert.match(css, /#000 18%/);
  assert.match(css, /#000 82%/);
  assert.match(css, /transparent 100%/);
  assert.match(css, /\.tile\[data-active='true'\][\s\S]*translateZ\(var\(--dw-lift/);
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*3/);
});

test('works bridge keeps normal flow and configures exactly three columns', () => {
  const source = read('src/components/ServicesPage/WorksBridge.tsx');
  const css = read('src/components/ServicesPage/WorksBridge.module.css');
  assert.match(source, /columns=\{3\}/);
  assert.match(source, /WE COULD KEEP/);
  assert.match(source, /TELLING YOU\./);
  assert.match(source, /OR WE COULD/);
  assert.match(source, /SHOW YOU\./);
  assert.doesNotMatch(css, /position:\s*sticky/);
  assert.doesNotMatch(css, /position:\s*fixed/);
  assert.match(css, /132svh/);
});

test('services route mounts the bridge after ServicesPage and suppresses only the old empty runway', () => {
  const route = read('src/app/services/page.tsx');
  const css = read('src/app/services/ServicesRoute.module.css');
  assert.match(route, /<ServicesPage\s*\/>[\s\S]*<WorksBridge\s*\/>/);
  assert.match(css, /section\[aria-label='Services'\]/);
  assert.match(css, /div\[aria-hidden='true'\]:last-child/);
  assert.match(css, /display:\s*none/);
});

test('works CTA is a semantic gooey link and the only work target', () => {
  const bridge = read('src/components/ServicesPage/WorksBridge.tsx');
  const gooey = read('src/components/ui/GooeyLink/GooeyLink.tsx');
  assert.match(bridge, /<GooeyLink[^>]*href="\/work"[^>]*label="VIEW OUR WORK"/);
  assert.match(gooey, /import Link from 'next\/link'/);
  assert.match(gooey, /data-active=/);
  assert.match(gooey, /GOOEY_PARTICLES\.map/);
});

test('temporary work assets are explicit and contain no fabricated proof', () => {
  for (let index = 1; index <= 6; index += 1) {
    const file = `public/work/placeholders/work-preview-${String(index).padStart(2, '0')}.svg`;
    const svg = read(file);
    assert.match(svg, new RegExp(`DEVELOPMENT PLACEHOLDER ${String(index).padStart(2, '0')}`));
    assert.match(svg, /width="1200" height="900"/);
    assert.doesNotMatch(svg, /CLIENT|AWARD|TESTIMONIAL|CASE STUDY|CONVERSION RATE/i);
  }
});

test('Services video copies share a bounded pool and release media outside the section', () => {
  const source = read('src/components/ui/DriftWall/useDriftWallVideo.ts');
  assert.match(source, /\? 1 : 3/);
  assert.match(source, /slice\(0, limit\)/);
  assert.match(source, /visible\.current\.has\(tile\.canvas\)/);
  assert.match(source, /requestVideoFrameCallback/);
  assert.match(source, /1000 \/ 24/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /video\.pause\(\)/);
  assert.match(source, /video\.removeAttribute\('src'\)/);
  assert.match(source, /intersection\.disconnect\(\)/);
  assert.match(read('src/components/ui/DriftWall/DriftWall.tsx'), /isNearViewport && !reduced/);
});

test('wall distribution is deterministic, varied, and mixes every project into every column', async () => {
  const { buildDriftColumns } = await import('../src/components/ui/DriftWall/driftWallMotion.ts');
  const items = ['a', 'b', 'c'].map(id => ({ id }));
  const columns = buildDriftColumns(items, 3);
  assert.deepEqual(columns, buildDriftColumns(items, 3));
  assert.equal(columns.length, 3);
  for (const column of columns) {
    assert.deepEqual([...new Set(column.map(item => item.id))].sort(), ['a', 'b', 'c']);
    column.forEach((item, i) => assert.notEqual(item.id, column[(i + 1) % column.length].id));
  }
  assert.notDeepEqual(columns[0], columns[1]);
  assert.deepEqual(buildDriftColumns([], 3), []);
  assert.deepEqual(buildDriftColumns([{ id: 'a' }], 3), [[{ id: 'a' }], [{ id: 'a' }], [{ id: 'a' }]]);
});

test('hover updates only the affected tiles and preserves video canvas references', () => {
  const source = read('src/components/ui/DriftWall/DriftWall.tsx');
  assert.doesNotMatch(source, /setActiveId/);
  assert.doesNotMatch(source, /elementFromPoint/);
  assert.match(source, /tile\.dataset\.active = 'true'/);
  assert.match(source, /hoveredColRef\.current = column/);
  assert.match(source, /width=\{192\}/);
  assert.match(source, /height=\{144\}/);
});
