import { timeout } from "./utils";

interface TimeoutOrPromise<Type> {
  timedOut: boolean;
  result?: Type; // Populated if not timed out
  promise?: Promise<Type>; // Populated if we did time out.
}

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
