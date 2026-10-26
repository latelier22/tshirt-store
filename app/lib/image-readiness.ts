export type ImageRequest = { src: string; sizes: string };

/** Small shared queue: avoid decoding nine large photos at once on low-memory TVs. */
export function createImageReadiness(
  load: (request: ImageRequest) => Promise<boolean>, concurrency = 2, capacity = 18
) {
  const cache = new Map<string, { promise: Promise<boolean>; done: boolean }>();
  const queue: (() => void)[] = [];
  let active = 0;
  const pump = () => {
    while (active < concurrency && queue.length) queue.shift()!();
  };
  function prepareOne(request: ImageRequest): Promise<boolean> {
    const key = `${request.sizes}|${request.src}`;
    const existing = cache.get(key);
    if (existing) return existing.promise;
    let finish!: (ready: boolean) => void;
    const record = { promise: new Promise<boolean>(resolve => { finish = resolve; }), done: false };
    cache.set(key, record);
    queue.push(() => {
      active++;
      void Promise.resolve().then(() => load(request)).catch(() => false).then(ready => {
        active--; record.done = true;
        if (!ready) cache.delete(key);
        finish(ready);
        for (const [oldKey, oldRecord] of cache) {
          if (cache.size <= capacity) break;
          if (oldRecord.done) cache.delete(oldKey);
        }
        pump();
      });
    });
    pump();
    return record.promise;
  }
  return {
    prepare: async (requests: ImageRequest[]) => (await Promise.all(requests.map(prepareOne))).every(Boolean),
  };
}
