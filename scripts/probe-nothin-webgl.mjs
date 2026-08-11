#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TARGET = 'https://www.noth.in/';
const DIAGNOSTICS_DIR = '.diagnostics';
const HEADED = process.argv.includes('--headed');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

async function waitForJson(url, timeoutMs = 12000) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }

  throw new Error(`Timed out waiting for Chrome DevTools endpoint: ${lastError ?? 'unknown error'}`);
}

async function connectCdp(url) {
  if (typeof WebSocket === 'undefined') {
    throw new Error('This probe requires Node 22+ with the built-in WebSocket implementation.');
  }

  const socket = new WebSocket(url);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(`${message.error.code}: ${message.error.message}`));
      else entry.resolve(message.result ?? {});
      return;
    }

    const callbacks = listeners.get(message.method);
    if (!callbacks) return;
    for (const callback of callbacks) callback(message.params ?? {});
  });

  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    on(method, callback) {
      const callbacks = listeners.get(method) ?? new Set();
      callbacks.add(callback);
      listeners.set(method, callbacks);
      return () => callbacks.delete(callback);
    },
    close() {
      socket.close();
    },
  };
}

const PROBE_SOURCE = String.raw`(() => {
  const state = {
    startedAt: performance.now(),
    contexts: [],
    extensions: [],
    shaders: [],
    programs: [],
    uniforms: [],
    textures: [],
    framebuffers: [],
    draws: {
      drawArrays: 0,
      drawElements: 0,
      drawArraysInstanced: 0,
      drawElementsInstanced: 0,
    },
    programUseCount: 0,
  };

  const shaderIds = new WeakMap();
  const programIds = new WeakMap();
  let nextShader = 1;
  let nextProgram = 1;

  const shaderId = (shader) => {
    if (!shader) return null;
    if (!shaderIds.has(shader)) shaderIds.set(shader, nextShader++);
    return shaderIds.get(shader);
  };

  const programId = (program) => {
    if (!program) return null;
    if (!programIds.has(program)) programIds.set(program, nextProgram++);
    return programIds.get(program);
  };

  const uniquePush = (array, value, key) => {
    if (!array.some((entry) => entry[key] === value[key])) array.push(value);
  };

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    const context = originalGetContext.call(this, type, ...args);
    if (context && (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2')) {
      state.contexts.push({
        type,
        width: this.width,
        height: this.height,
        attributes: (() => {
          try { return context.getContextAttributes?.() ?? null; } catch { return null; }
        })(),
      });
    }
    return context;
  };

  const patch = (proto, name, before) => {
    if (!proto) return;
    const original = proto[name];
    if (typeof original !== 'function' || original.__weberaiseProbeWrapped) return;

    function wrapped(...args) {
      try { before.call(this, args); } catch {}
      return original.apply(this, args);
    }
    wrapped.__weberaiseProbeWrapped = true;

    try { proto[name] = wrapped; } catch {}
  };

  const patchContext = (Ctor) => {
    if (!Ctor?.prototype) return;
    const proto = Ctor.prototype;

    patch(proto, 'createShader', function() {});
    patch(proto, 'shaderSource', function(args) {
      const [shader, source] = args;
      const id = shaderId(shader);
      const type = (() => {
        try { return this.getShaderParameter(shader, this.SHADER_TYPE); } catch { return null; }
      })();
      state.shaders.push({ id, type, source: String(source) });
    });

    patch(proto, 'createProgram', function() {});
    patch(proto, 'attachShader', function(args) {
      const [program, shader] = args;
      const id = programId(program);
      let entry = state.programs.find((candidate) => candidate.id === id);
      if (!entry) {
        entry = { id, shaders: [] };
        state.programs.push(entry);
      }
      const sid = shaderId(shader);
      if (!entry.shaders.includes(sid)) entry.shaders.push(sid);
    });

    patch(proto, 'useProgram', function(args) {
      state.programUseCount += 1;
      programId(args[0]);
    });

    patch(proto, 'getUniformLocation', function(args) {
      const [program, name] = args;
      uniquePush(state.uniforms, { program: programId(program), name: String(name) }, 'name');
    });

    patch(proto, 'getExtension', function(args) {
      uniquePush(state.extensions, { name: String(args[0]) }, 'name');
    });

    patch(proto, 'texImage2D', function(args) {
      const item = { method: 'texImage2D', target: args[0], level: args[1], internalFormat: args[2] };
      if (typeof args[3] === 'number' && typeof args[4] === 'number') {
        item.width = args[3];
        item.height = args[4];
        item.format = args[6];
        item.type = args[7];
      } else {
        const source = args.at(-1);
        item.width = source?.width ?? source?.videoWidth ?? null;
        item.height = source?.height ?? source?.videoHeight ?? null;
        item.format = args[3];
        item.type = args[4];
      }
      state.textures.push(item);
    });

    patch(proto, 'texStorage2D', function(args) {
      state.textures.push({
        method: 'texStorage2D',
        target: args[0],
        levels: args[1],
        internalFormat: args[2],
        width: args[3],
        height: args[4],
      });
    });

    patch(proto, 'bindFramebuffer', function(args) {
      state.framebuffers.push({ target: args[0], bound: Boolean(args[1]) });
    });

    for (const method of Object.keys(state.draws)) {
      patch(proto, method, function() { state.draws[method] += 1; });
    }
  };

  patchContext(globalThis.WebGLRenderingContext);
  patchContext(globalThis.WebGL2RenderingContext);

  Object.defineProperty(globalThis, '__WEBERAISE_WEBGL_PROBE__', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: state,
  });
})();`;

function dedupeShaders(shaders) {
  const bySource = new Map();
  for (const shader of shaders ?? []) {
    const key = `${shader.type}:${shader.source}`;
    if (!bySource.has(key)) bySource.set(key, shader);
  }
  return [...bySource.values()];
}

function shaderReport(shaders) {
  return shaders.map((shader, index) => [
    `===== SHADER ${index + 1} | runtime id ${shader.id} | type ${shader.type} =====`,
    shader.source,
    '',
  ].join('\n')).join('\n');
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error('No Chrome/Chromium executable found. Set CHROME_BIN=/path/to/chromium and retry.');
  }

  const profile = await mkdtemp(join(tmpdir(), 'weberaise-nothin-probe-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,1000',
  ];
  if (!HEADED) args.push('--headless=new');
  args.push('about:blank');

  const chromeProcess = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let chromeErrors = '';
  chromeProcess.stderr.on('data', (chunk) => { chromeErrors += String(chunk); });

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const targets = await waitForJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((target) => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a debuggable page target.');

    const cdp = await connectCdp(page.webSocketDebuggerUrl);
    try {
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE_SOURCE });
      await cdp.send('Page.navigate', { url: TARGET });

      await sleep(7000);

      const viewportResult = await cdp.send('Runtime.evaluate', {
        expression: '({ width: innerWidth, height: innerHeight, ready: document.readyState })',
        returnByValue: true,
      });
      const viewport = viewportResult.result?.value ?? { width: 1440, height: 1000 };

      // Exercise the hero interaction so lazily-used WebGL programs and passes appear.
      const points = [
        [0.30, 0.56], [0.36, 0.53], [0.43, 0.58], [0.50, 0.54],
        [0.57, 0.60], [0.64, 0.55], [0.71, 0.59],
      ];
      for (const [nx, ny] of points) {
        await cdp.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: Math.round(viewport.width * nx),
          y: Math.round(viewport.height * ny),
          button: 'none',
        });
        await sleep(140);
      }

      await sleep(4500);

      const result = await cdp.send('Runtime.evaluate', {
        expression: `(() => ({
          probe: globalThis.__WEBERAISE_WEBGL_PROBE__ ?? null,
          scripts: [...document.scripts].map((script) => script.src).filter(Boolean),
          canvas: [...document.querySelectorAll('canvas')].map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
          })),
          url: location.href,
          title: document.title,
        }))()`,
        returnByValue: true,
      });

      const value = result.result?.value;
      if (!value?.probe) {
        throw new Error('Probe state was not present. The page may have blocked or replaced the injected runtime.');
      }

      const shaders = dedupeShaders(value.probe.shaders);
      const summary = {
        capturedAt: new Date().toISOString(),
        target: TARGET,
        browser: chrome,
        headed: HEADED,
        page: {
          url: value.url,
          title: value.title,
          scripts: value.scripts,
          canvas: value.canvas,
        },
        webgl: {
          ...value.probe,
          shaders: shaders.map(({ id, type, source }) => ({ id, type, length: source.length })),
        },
      };

      await mkdir(DIAGNOSTICS_DIR, { recursive: true });
      await writeFile(join(DIAGNOSTICS_DIR, 'nothin-webgl.json'), `${JSON.stringify(summary, null, 2)}\n`);
      await writeFile(join(DIAGNOSTICS_DIR, 'nothin-shaders.txt'), shaderReport(shaders));

      console.log('Nothin WebGL probe captured.');
      console.log(`Contexts: ${summary.webgl.contexts.length}`);
      console.log(`Unique shaders: ${shaders.length}`);
      console.log(`Programs: ${summary.webgl.programs.length}`);
      console.log(`Uniform names: ${summary.webgl.uniforms.length}`);
      console.log(`Texture allocations observed: ${summary.webgl.textures.length}`);
      console.log(`Draw calls: ${JSON.stringify(summary.webgl.draws)}`);
      console.log(`Output: ${DIAGNOSTICS_DIR}/nothin-webgl.json`);
      console.log(`Shader capture: ${DIAGNOSTICS_DIR}/nothin-shaders.txt`);
    } finally {
      cdp.close();
    }
  } catch (error) {
    if (chromeErrors.trim()) console.error(chromeErrors.trim().slice(-4000));
    throw error;
  } finally {
    chromeProcess.kill('SIGTERM');
    await rm(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
