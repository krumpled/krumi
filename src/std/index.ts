import {
  Option,
  fromNullable,
  map as mapOption,
  none,
  some,
} from '@krumpled/krumi/std/option';
import { Result, ok, err, map as mapResult } from '@krumpled/krumi/std/result';
import {
  AsyncRequest,
  loading,
  loaded,
  notAsked,
  failed,
} from '@krumpled/krumi/std/async-request';

export function always<T>(item: T): () => T {
  return (): T => item;
}

function separateWords(
  input: string,
  options?: { separator?: string; split?: string },
): string {
  const separator = options?.separator || '_';
  const split = options?.split || /(?=[A-Z])/;
  return input.split(split).join(separator);
}

export function underscoreKeys(input: object): object {
  return Object.keys(input).reduce((acc, k) => {
    const underscored = separateWords(k).toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...acc, [underscored]: (input as any)[k] } as any;
  }, {} as object);
}

export function resultToMaybe<T>(res: Result<T>): Option<T> {
  switch (res.kind) {
    case 'err':
      return none();
    case 'ok': {
      const { data } = res;
      return some(data);
    }
  }
}

export {
  none,
  some,
  fromNullable,
  Option,
  AsyncRequest,
  loading,
  loaded,
  notAsked,
  failed,
  err,
  ok,
  Result,
  mapResult,
  mapOption,
};
