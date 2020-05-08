export type None = { kind: 'none' };
export type Some<T> = { kind: 'some'; data: T };
export type Option<T> = None | Some<T>;

export function fromNullable<T>(item: T | undefined | null): Option<T> {
  return item === undefined || item === null
    ? { kind: 'none' }
    : { data: item, kind: 'some' };
}

export function map<T>(option: Option<T>): Option<T> {
  return option;
}

export function some<T>(data: T): Option<T> {
  return { kind: 'some', data };
}

export function none<T>(): Option<T> {
  return { kind: 'none' };
}
