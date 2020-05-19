export type None = { kind: 'none' };
export type Some<T> = { kind: 'some'; data: T };
export type Option<T> = None | Some<T>;

export function fromNullable<T>(item: T | undefined | null): Option<T> {
  return item === undefined || item === null
    ? { kind: 'none' }
    : { data: item, kind: 'some' };
}

export function some<T>(data: T): Option<T> {
  return { kind: 'some', data };
}

export function none<T>(): Option<T> {
  return { kind: 'none' };
}

export function map<T, U>(
  option: Option<T>,
  mapper: (inner: T) => U,
): Option<U> {
  return option.kind === 'some' ? some(mapper(option.data)) : none();
}

export function fuse<T, U>(one: Option<T>, other: Option<U>): Option<T & U> {
  if (one.kind === 'none' || other.kind === 'none') {
    return none();
  }

  return some({ ...one.data, ...other.data });
}

export function mapAsync<T, U>(
  option: Option<T>,
  mapper: (inner: T) => Promise<U>,
): Promise<Option<U>> {
  return option.kind === 'some'
    ? mapper(option.data).then(some)
    : Promise.resolve(option);
}

export function unwrapOr<T>(opt: Option<T>, other: T): T {
  return opt.kind === 'some' ? opt.data : other;
}
