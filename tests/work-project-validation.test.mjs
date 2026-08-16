import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWorkProject } from '../src/content/workProjectValidation.ts';

const project = {
  slug: 'fixture-a',
  name: 'Fixture A',
  category: 'WEB DESIGN',
  brief: 'Fixture brief.',
  services: ['Design'],
  year: '2026',
  liveUrl: 'https://example.com',
  media: {
    poster: '/work/fixture/poster.webp',
    browsePreview: '/work/fixture/browse.mp4',
    showcasePoster: '/work/fixture/showcase-poster.webp',
    showcaseVideo: '/work/fixture/showcase.mp4',
  },
};

test('valid project contract has no errors', () => {
  assert.deepEqual(validateWorkProject(project), []);
});

test('invalid live url and missing browse media are rejected', () => {
  const errors = validateWorkProject({
    ...project,
    liveUrl: '#',
    media: { ...project.media, browsePreview: '' },
  });
  assert.ok(errors.some(error => error.includes('liveUrl')));
  assert.ok(errors.some(error => error.includes('browsePreview')));
});
