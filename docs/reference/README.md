# WEBERAISE Reference Documentation

This directory preserves the planning, research, and implementation context developed before and during the signature-intro build.

## Canonical reading order

1. [`WEBERAISE_MASTER_PLANNING.md`](./WEBERAISE_MASTER_PLANNING.md)
2. [`WEBERAISE_WEBGL_REVEAL_RESEARCH.md`](./WEBERAISE_WEBGL_REVEAL_RESEARCH.md)
3. [`WEBERAISE_MASTER_IMPLEMENTATION_PROMPT.md`](./WEBERAISE_MASTER_IMPLEMENTATION_PROMPT.md)
4. [`WEBERAISE_HANDOFF_PROMPT.md`](./WEBERAISE_HANDOFF_PROMPT.md)
5. `../../reference-skeleton/` for the original static hierarchy/content skeleton

## Source-of-truth precedence

When documents conflict:

1. newer explicit decisions in the Master Planning document win;
2. WebGL Research controls technical reference/research only;
3. Master Implementation Prompt controls implementation workflow/architecture where it does not contradict the Master Planning document;
4. the older Handoff and static skeleton are historical/contextual references.

## Why some canonical documents use `.parts/`

Three long documents are stored losslessly in ordered Markdown parts because the GitHub connector used during the handoff has payload-size limits. The index file at the canonical name lists the parts in exact reading order.

To reconstruct a single local file:

```bash
cat WEBERAISE_MASTER_PLANNING.parts/part-*.md > WEBERAISE_MASTER_PLANNING.full.md
cat WEBERAISE_WEBGL_REVEAL_RESEARCH.parts/part-*.md > WEBERAISE_WEBGL_REVEAL_RESEARCH.full.md
cat WEBERAISE_MASTER_IMPLEMENTATION_PROMPT.parts/part-*.md > WEBERAISE_MASTER_IMPLEMENTATION_PROMPT.full.md
```

The parts contain the full source text; they are not summaries.
