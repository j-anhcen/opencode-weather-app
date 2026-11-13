import type { Interface } from "node:readline";

const QUEUE_KEY = "__weatherCliInputLines";

type GlobalWithQueue = typeof globalThis & { [QUEUE_KEY]?: string[] };

function inputQueue(): string[] {
  const global = globalThis as GlobalWithQueue;
  global[QUEUE_KEY] ??= [];
  return global[QUEUE_KEY];
}

export function queueInput(...lines: string[]): void {
  inputQueue().push(...lines);
}

export function resetInputQueue(): void {
  inputQueue().length = 0;
}

export function pendingInput(): number {
  return inputQueue().length;
}

let closeCalls = 0;

export function closeCallCount(): number {
  return closeCalls;
}

export function resetCloseCalls(): void {
  closeCalls = 0;
}

/**
 * Reemplazo de `createInterface` para `node:readline`: el iterador consume la
 * cola de líneas y devuelve `done` cuando se queda vacía (simula EOF).
 */
export function createReadlineMock(): Interface {
  const lines = inputQueue();

  const iterator: AsyncIterableIterator<string> = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next(): Promise<IteratorResult<string, void>> {
      const value = lines.shift();
      if (value === undefined) return Promise.resolve({ done: true, value: undefined });
      return Promise.resolve({ done: false, value });
    },
  };

  return {
    close() {
      closeCalls += 1;
    },
    [Symbol.asyncIterator]: () => iterator,
  } as unknown as Interface;
}
