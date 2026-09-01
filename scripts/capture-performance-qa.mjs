import { mkdir, writeFile } from 'node:fs/promises';

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error(`Invalid argument near ${key ?? 'end'}`);
    values.set(key.slice(2), value);
  }
  const ws = values.get('ws');
  const url = values.get('url') ?? 'http://127.0.0.1:3000';
  const out = values.get('out');
  const viewport = values.get('viewport') ?? '1440x900';
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (!ws || !out || !match) throw new Error('Usage: --ws WS --url URL --out DIR --viewport WIDTHxHEIGHT');
  return { ws, url, out, width: Number(match[1]), height: Number(match[2]) };
}

const options = parseArguments(process.argv.slice(2));
await mkdir(options.out, { recursive: true });
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  return result.result.value;
};
const waitFor = async (expression, label, attempts = 160) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
};
const capture = async (filename) => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${options.out}/${filename}`, Buffer.from(result.data, 'base64'));
};
const snapshot = async (name) => {
  const resources = await evaluate(`performance.getEntriesByType('resource').map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    startTime: entry.startTime,
    duration: entry.duration
  }))`);
  const navigation = await evaluate(`performance.getEntriesByType('navigation')[0]?.toJSON() ?? null`);
  const longTasks = await evaluate(`globalThis.__wrLongTasks ?? []`);
  const metrics = await call('Performance.getMetrics');
  await capture(`${name}.png`);
  return { resources, navigation, longTasks, metrics: metrics.metrics };
};

await call('Page.enable');
await call('Runtime.enable');
await call('Performance.enable');
await call('Emulation.setDeviceMetricsOverride', {
  width: options.width,
  height: options.height,
  deviceScaleFactor: 1,
  mobile: options.width <= 720,
});
await call('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
});
await call('Page.addScriptToEvaluateOnNewDocument', {
  source: `globalThis.__wrLongTasks = []; new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) globalThis.__wrLongTasks.push({ startTime: entry.startTime, duration: entry.duration });
  }).observe({ type: 'longtask', buffered: true });`,
});
await call('Page.navigate', { url: options.url });
await waitFor(`document.readyState === 'complete'`, 'document complete');
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'heroInteractive'`, 'heroInteractive');
const heroInteractive = await snapshot('hero-interactive');
await evaluate(`document.querySelector('.hero-explore')?.click()`);
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'main'`, 'main');
await wait(900);
const main = await snapshot('main');
await writeFile(
  `${options.out}/metrics.json`,
  `${JSON.stringify({ viewport: { width: options.width, height: options.height }, heroInteractive, main }, null, 2)}\n`,
);
socket.close();
