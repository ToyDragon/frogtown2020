import { timeout } from "./utils";

interface TimeoutOrPromise<Type> {
  timedOut: boolean;
  // Populated if not timed out
  result?: Type;
  // Populated if we did time out.
  promise?: Promise<Type>;
}

// Resolves after the card image is loaded into the element.
export async function resolveOrTimeout<Type>(
  promise: Promise<Type>,
  timeoutMillis: number
): Promise<TimeoutOrPromise<Type>> {
  return Promise.race([
    (async () => {
      return { timedOut: false, result: await promise };
    })(),
    (async () => {
      await timeout(timeoutMillis);
      return { timedOut: true, promise: promise };
    })(),
  ]);
}
