export type NotAsked = { kind: 'not-asked' };
export type Loading<T> = { kind: 'loading'; promise: Promise<T> };
export type Loaded<T> = { kind: 'loaded'; data: T };
export type Failed = { kind: 'failed'; errors: Array<Error> };
export type AsyncRequest<T> = NotAsked | Loading<T> | Loaded<T> | Failed;

export function notAsked<T>(): AsyncRequest<T> {
  return { kind: 'not-asked' };
}

export function loading<T>(promise: Promise<T>): AsyncRequest<T> {
  return { kind: 'loading', promise };
}

export function loaded<T>(data: T): AsyncRequest<T> {
  return { kind: 'loaded', data };
}

export function failed<T>(errors: Array<Error>): AsyncRequest<T> {
  return { kind: 'failed', errors };
}
