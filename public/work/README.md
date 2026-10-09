# Work media contract

Each project keeps its gallery and showcase media together:

```text
poster.webp            16:10 still for the sphere and Services wall
browse.mp4             muted 8-second H.264 loop, 640×400 at 20fps
showcase-poster.webp   full-width still matching the showcase's first frame
showcase.mp4           H.264 walkthrough, 1280×628, loaded only when opened
```

Current folders: `projects/sound-angels/`, `projects/playstation-collection/`,
`projects/porsche-911-gt3-r/`.

## Encoding

The supplied 1280×720 recordings include 92px of browser chrome. That is removed
at encoding time. First useful frames start at 1s, 1s and 4s respectively.
Original recordings remain at the supplied paths outside this repository.

Preview recipe (substitute the input and start time):

```sh
ffmpeg -ss START -i INPUT -t 8 -an \
  -vf 'crop=1004:628:138:92,scale=640:400:flags=lanczos,fps=20' \
  -c:v libx264 -preset slow -crf 25 -maxrate 800k -bufsize 1600k \
  -pix_fmt yuv420p -movflags +faststart browse.mp4
```

Showcase recipe:

```sh
ffmpeg -ss START -i INPUT -vf 'crop=1280:628:0:92' \
  -c:v libx264 -preset slow -crf 21 -an \
  -pix_fmt yuv420p -movflags +faststart showcase.mp4
```

Both MP4 types put metadata before media data for progressive playback. Posters
use the same first useful frame and crop as their corresponding video. Showcase
aspect ratio is declared in `src/content/workProjects.ts`.

## Playback budgets

- Work uses at most three preview decoders on desktop, two on the lite profile,
  one on mobile, and no preview downloads under reduced motion.
- A decoder follows its project when the globe rotates; changing physical tiles
  does not reload the same clip. Until a decoded frame is ready, its poster stays visible.
- Atlas and video uploads use top-origin coordinates matching the sphere mesh;
  flipping the entire atlas would swap project rows.
- Services reads the same project data, sharing at most three decoders across
  repeated tiles (one on mobile). Only visible canvases are painted, at the preview’s 24fps.
- Services releases videos outside the section and pauses them in hidden tabs.
  Reduced motion uses stills.
- Full showcases are mounted only for the opened project and use native controls.
- Do not preload full walkthroughs from the globe or Services.
- Only add media supplied or verified by the agency.

## Compatibility and Services previews

- `showcase.webm` is a silent VP9 alternative to the silent H.264 showcase. The player
  declares MIME types and switches containers after a failed source or decoder.
  It mounts only one source at a time, so fallback bytes are not downloaded on
  successful MP4 playback. Both formats retain the same crop and first frame.
- `teaser.mp4` is a separate muted 320×200, 24fps H.264 Baseline encode for
  Services. Globe previews retain their 640×400 resolution.
- The Services wall uses 192×144 canvases. Each new video frame is cropped once
  per project into a shared raster, then copied to visible tiles. Frame callbacks
  follow decoded video frames; browsers without them use a 24fps timer.
- Every column has a stable shuffled sequence of all projects. Hover updates the
  active tile directly, preserving its decoder/canvas while pausing that column
  and lifting the tile. There is no wall-wide React render on pointer hover.

All published portfolio videos have no audio tracks. The showcase player is also
muted by default; globe and Services preview decoders remain muted.
