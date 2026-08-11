# Nothin WebGL Runtime Probe

This project includes `scripts/probe-nothin-webgl.mjs` to inspect **publicly delivered runtime WebGL behavior** from `https://www.noth.in/` on a network-enabled local machine.

The purpose is technical comparison: shader/program count, uniform names, render-target dimensions, texture formats, framebuffer use, WebGL version, and draw-call structure. It also captures shader source strings that the public page itself passes into WebGL so we can inspect architectural patterns.

## Important boundary

The captured shader text is for analysis only.

Do **not** paste proprietary Nothin shader code into Weberaise. Use the output to answer questions such as:

- Is the effect built from a feedback field, implicit/metaball field, blur/threshold chain, or another method?
- How many render passes are involved?
- What approximate render-target resolution is used?
- Are floating-point textures/extensions used?
- Are there explicit uniforms that suggest age, viscosity, dissipation, blur, thresholding, pointer velocity, or noise?

Then reproduce the **observable behavior** independently in Weberaise.

## Requirements

- Node 22+; Node 24 is recommended.
- Chromium or Google Chrome installed.
- Internet access to `www.noth.in`.

The script has no npm dependencies.

## Run

From the repository root:

```bash
node scripts/probe-nothin-webgl.mjs
```

For the closest match to an ordinary interactive browser session, use headed mode:

```bash
node scripts/probe-nothin-webgl.mjs --headed
```

If Chromium is not found automatically:

```bash
CHROME_BIN=/usr/bin/chromium node scripts/probe-nothin-webgl.mjs --headed
```

## Output

The probe creates:

```text
.diagnostics/nothin-webgl.json
.diagnostics/nothin-shaders.txt
```

`.diagnostics/` is gitignored.

The JSON report contains summarized WebGL/runtime metadata. The shader text file contains the captured public-runtime shader strings for local inspection.

## What to compare against Weberaise

After running the probe, inspect the result before doing another tuning pass. Focus on:

1. Number of WebGL contexts and whether WebGL2 is used.
2. Number of unique shader programs.
3. Render-target dimensions relative to viewport size.
4. Texture internal formats and whether float/half-float buffers appear.
5. Uniform names suggesting field simulation, blur, threshold, pointer velocity, time, dissipation, or noise.
6. Whether the effect appears to use one field pass or a multi-pass pipeline.
7. Whether shader code reveals a signed-distance/metaball pattern, feedback/advection pattern, or blur-plus-threshold surface extraction.

Do not optimize Weberaise around a guessed architecture once this probe has provided stronger evidence.
