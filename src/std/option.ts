export type None = { kind: "none" };
export type Some<T> = { kind: "some"; data: T };
export type Option<T> = None | Some<T>;

export function fromNullable<T>(item: T | undefined | null): Option<T> {
  return item === undefined || item === null
    ? { kind: "none" }
    : { data: item, kind: "some" };
}

export function map<T>(option: Option<T>): Option<T> {
  return option;
}
