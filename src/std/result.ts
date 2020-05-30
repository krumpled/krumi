export type Err = { kind: 'err'; errors: Array<Error> };
export type Ok<T> = { kind: 'ok'; data: T };
export type Result<T> = Err | Ok<T>;

export function ok<T>(data: T): Result<T> {
  return { kind: 'ok', data };
}

export function err<T>(errors: Array<Error>): Result<T> {
  return { kind: 'err', errors };
}

export function map<T, U>(res: Result<T>, mapper: (inner: T) => U): Result<U> {
  return res.kind === 'ok' ? ok(mapper(res.data)) : err(res.errors);
}

export function asPromise<T>(res: Result<T>): Promise<T> {
  return res.kind === 'err' ? Promise.reject(res.errors[0]) : Promise.resolve(res.data);
}
