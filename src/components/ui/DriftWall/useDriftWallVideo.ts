'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { DriftWallItem } from './DriftWall';

type Tile = { projectId: string; canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };

/** Repeated tiles share decoders. Only visible canvases receive decoded frames. */
export function useDriftWallVideo(
  items: readonly DriftWallItem[],
  root: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const tiles = useRef(new Map<string, Tile>());
  const visible = useRef(new Set<Element>());
  const observer = useRef<IntersectionObserver | null>(null);

  const registerCanvas = useCallback((tileId: string, projectId: string, canvas: HTMLCanvasElement | null) => {
    const previous = tiles.current.get(tileId);
    if (previous?.canvas === canvas) return;
    if (previous) {
      observer.current?.unobserve(previous.canvas);
      visible.current.delete(previous.canvas);
      tiles.current.delete(tileId);
    }
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    tiles.current.set(tileId, { projectId, canvas, context });
    observer.current?.observe(canvas);
  }, []);

  useEffect(() => {
    if (!enabled || !root.current) return;
    const limit = window.matchMedia('(max-width: 640px)').matches ? 1 : 3;
    const sources = items.filter((item, index) => item.video
      && items.findIndex(other => other.id === item.id) === index).slice(0, limit);
    const intersection = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.current.add(entry.target);
        else visible.current.delete(entry.target);
      }
    }, { root: root.current });
    observer.current = intersection;
    for (const tile of tiles.current.values()) intersection.observe(tile.canvas);

    const players = sources.map(item => {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = item.video!;
      const frame = document.createElement('canvas');
      frame.width = 192;
      frame.height = 144;
      return { id: item.id, video, frame, context: frame.getContext('2d', { alpha: false }),
        frameHandle: null as number | null, timer: null as ReturnType<typeof setTimeout> | null };

    });
    let disposed = false;
    let sectionVisible = false;
    type Player = (typeof players)[number];
    const cancelFrame = (player: Player) => {
      if (player.frameHandle !== null) player.video.cancelVideoFrameCallback(player.frameHandle);
      if (player.timer !== null) clearTimeout(player.timer);
      player.frameHandle = null;
      player.timer = null;
    };
    const scheduleFrame = (player: Player) => {
      const paint = () => {
        player.frameHandle = null;
        player.timer = null;
        if (disposed || document.hidden || !sectionVisible) return;
        const { video, frame, context } = player;
        const targets = [...tiles.current.values()].filter(tile =>
          tile.projectId === player.id && visible.current.has(tile.canvas));
        if (targets.length && context && video.readyState >= 2 && video.videoWidth) {
          const sw = video.videoHeight * frame.width / frame.height;
          // Convert and crop a decoded frame once, then copy the small raster to its tiles.
          context.drawImage(video, (video.videoWidth - sw) / 2, 0, sw, video.videoHeight,
            0, 0, frame.width, frame.height);
          for (const { canvas, context: target } of targets) {
            target.drawImage(frame, 0, 0, canvas.width, canvas.height);
            if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
          }
        }
        scheduleFrame(player);
      };
      if (player.video.requestVideoFrameCallback) {
        player.frameHandle = player.video.requestVideoFrameCallback(paint);
      } else player.timer = setTimeout(paint, 1000 / 24);
    };
    const updatePlayback = () => {
      for (const player of players) {
        cancelFrame(player);
        if (document.hidden || !sectionVisible) player.video.pause();
        else {
          void player.video.play().catch(() => undefined);
          scheduleFrame(player);
        }
      }
    };
    const sectionObserver = new IntersectionObserver(([entry]) => {
      sectionVisible = entry.isIntersecting;
      updatePlayback();
    });
    sectionObserver.observe(root.current);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();
    return () => {
      disposed = true;
      players.forEach(cancelFrame);
      document.removeEventListener('visibilitychange', updatePlayback);
      intersection.disconnect();
      sectionObserver.disconnect();
      observer.current = null;
      visible.current.clear();
      for (const { canvas } of tiles.current.values()) canvas.style.opacity = '0';
      for (const { video } of players) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [enabled, items, root]);

  return registerCanvas;
}
