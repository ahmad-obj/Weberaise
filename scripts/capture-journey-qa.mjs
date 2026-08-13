import { mkdir, writeFile } from 'node:fs/promises';

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith('--') || value === undefined) throw new Error(`Invalid argument near ${name ?? 'end of command'}`);
    values.set(name.slice(2), value);
  }

  const ws = values.get('ws');
  const url = values.get('url') ?? 'http://localhost:3000';
  const outputDir = values.get('out');
  const viewport = values.get('viewport');
  if (!ws || !outputDir || !viewport) {
    throw new Error('Usage: node scripts/capture-journey-qa.mjs --ws ws://127.0.0.1:9222/devtools/page/ID --url http://localhost:3000 --out /tmp/output --viewport 1440x900');
  }
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (!match) throw new Error(`Invalid viewport ${viewport}; expected WIDTHxHEIGHT`);
  return { ws, url, outputDir, width: Number(match[1]), height: Number(match[2]) };
}

const options = parseArguments(process.argv.slice(2));
await mkdir(options.outputDir, { recursive: true });

const socket = new WebSocket(options.ws);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = () => reject(new Error(`Unable to connect to ${options.ws}`));
});

let sequence = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handlers = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) handlers.reject(new Error(message.error.message));
  else handlers.resolve(message.result);
};

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  return result.result.value;
};
const capture = async (filename) => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${options.outputDir}/${filename}`, Buffer.from(result.data, 'base64'));
};
const waitFor = async (expression, label, attempts = 120) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

await call('Page.enable');
await call('Runtime.enable');
await call('Emulation.setDeviceMetricsOverride', {
  width: options.width,
  height: options.height,
  deviceScaleFactor: 1,
  mobile: options.width <= 720,
});
await call('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
});
await call('Page.navigate', { url: options.url });
await waitFor('document.readyState === "complete"', 'page load');
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'heroInteractive'`, 'interactive hero');
await evaluate(`document.querySelector('.hero-explore')?.click()`);
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'main'`, 'main experience');
await wait(900);

const stops = await evaluate(`Object.fromEntries([...document.querySelectorAll('[data-journey-stop]')].map((node) => {
  const rect = node.getBoundingClientRect();
  return [node.dataset.journeyStop, { top: rect.top + scrollY, height: rect.height }];
}))`);

const checkpoints = [
  ['approach', 0.9, 120],
  ['trigger', 0.76, 90],
  ['mid', 0.52, 420],
  ['final', 0.28, 1300],
];
const evidence = { viewport: { width: options.width, height: options.height }, stops, frames: [] };

for (const [stopId, stop] of Object.entries(stops)) {
  for (const [name, viewportRatio, settle] of checkpoints) {
    const top = Math.max(0, Math.round(stop.top - options.height * viewportRatio));
    await evaluate(`scrollTo({ top: ${top}, behavior: 'instant' })`);
    await wait(settle);
    const filename = `${stopId}-${name}-${options.width}x${options.height}.png`;
    await capture(filename);
    const state = await evaluate(`(() => {
      const stop = document.querySelector('[data-journey-stop="${stopId}"]');
      const rect = stop?.getBoundingClientRect();
      return {
        scrollY,
        revealed: stop?.dataset.revealed ?? null,
        stopRect: rect ? { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null,
        dashOffsets: [...document.querySelectorAll('[data-ribbon-path], [data-ribbon-stroke]')].map((path) => ({
          layer: path.getAttribute('data-ribbon-path'),
          stroke: path.getAttribute('data-ribbon-stroke'),
          dashOffset: getComputedStyle(path).strokeDashoffset,
        })),
      };
    })()`);
    evidence.frames.push({ stopId, checkpoint: name, filename, ...state });
  }
}

await writeFile(`${options.outputDir}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
socket.close();
