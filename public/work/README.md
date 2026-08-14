# Work media contract

Each production project should provide these derivatives under its own folder:

```text
poster.webp            sharp sphere still, target about 1600px wide
browse.mp4             muted short looping website preview, web-friendly H.264
browse.webm            optional modern browse derivative
showcase-poster.webp   large still matching the full video opening frame
showcase.mp4           high-quality walkthrough loaded only on project demand
```

Requirements:

- `poster.webp` and the first usable browse-video frame must share the same crop/composition so poster→motion promotion is visually invisible.
- Browse videos contain no audio, are short/loopable, and are encoded specifically for the spherical gallery rather than resized from a giant source at runtime.
- The front project must remain sharp at its maximum expected projected size; if motion is not decoded yet, keep the sharp poster instead of showing a blurry/black video texture.
- Showcase media does not block the Work opening and is not preloaded for every project.
- Do not place unverified client/project media into production Work data.
