#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
for file in prototype/index.html prototype/styles.css prototype/app.js prototype/reveal-engine.js; do
  test -f "$file" || { echo "missing $file" >&2; exit 1; }
done
grep -q 'data-loader-count' prototype/index.html
grep -q 'data-loader-line' prototype/index.html
grep -q 'data-hero-root' prototype/index.html
grep -q 'data-hero-front' prototype/index.html
grep -q 'data-hero-reveal' prototype/index.html
grep -q 'data-explore' prototype/index.html
grep -q 'data-first-impression' prototype/index.html
grep -q 'width="1800" height="430"' prototype/index.html
grep -q 'class RevealEngine' prototype/reveal-engine.js
grep -q 'bottomFill' prototype/reveal-engine.js
grep -q 'createAutonomousStroke' prototype/app.js
grep -q 'await resizeEngine' prototype/app.js
grep -q 'await i.decode' prototype/app.js
echo "prototype smoke: PASS"
