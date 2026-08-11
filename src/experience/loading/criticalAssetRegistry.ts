export type CriticalTask = {
  id: string;
  weight: number;
  run: (report: (progress: number) => void) => Promise<unknown> | unknown;
};

export type CriticalAssetSnapshot = {
  progress: number;
  ready: boolean;
  started: boolean;
  completed: readonly string[];
};

export type CriticalAssetRegistry = {
  start(): Promise<void>;
  subscribe(listener: (snapshot: CriticalAssetSnapshot) => void): () => void;
  snapshot(): CriticalAssetSnapshot;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function createCriticalAssetRegistry(tasks: readonly CriticalTask[]): CriticalAssetRegistry {
  const progressById = new Map(tasks.map((task) => [task.id, 0]));
  const listeners = new Set<(snapshot: CriticalAssetSnapshot) => void>();
  const totalWeight = tasks.reduce((sum, task) => sum + Math.max(0, task.weight), 0) || 1;
  let started = false;
  let startPromise: Promise<void> | null = null;

  const snapshot = (): CriticalAssetSnapshot => {
    let weighted = 0;
    const completed: string[] = [];
    for (const task of tasks) {
      const progress = progressById.get(task.id) ?? 0;
      weighted += progress * Math.max(0, task.weight);
      if (progress >= 1) completed.push(task.id);
    }
    const progress = clamp01(weighted / totalWeight);
    return { progress, ready: progress >= 1, started, completed };
  };

  const emit = () => {
    const value = snapshot();
    for (const listener of listeners) listener(value);
  };

  const setProgress = (id: string, progress: number) => {
    progressById.set(id, clamp01(progress));
    emit();
  };

  return {
    start() {
      if (startPromise) return startPromise;
      started = true;
      emit();
      startPromise = Promise.all(
        tasks.map(async (task) => {
          await task.run((progress) => setProgress(task.id, progress));
          setProgress(task.id, 1);
        }),
      ).then(() => undefined);
      return startPromise;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    snapshot,
  };
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Critical image failed to load: ${src}`));
    image.src = src;
  });
}
