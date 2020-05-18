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

function camelize(input: string): string {
  const replaced = input.replace(/[-_\s]+(.)?/g, (_match, chr) =>
    (chr || '').toUpperCase(),
  );
  return replaced.substr(0, 1).toLowerCase() + replaced.substr(1);
}

export function camelizeKeys(input: object): object {
  if (typeof input !== 'object') {
    return input;
  }

  return Object.keys(input).reduce((acc, k) => {
    const camelized = camelize(k);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (input as any)[k];

    if (Array.isArray(value)) {
      const nested = value.map(camelizeKeys);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...acc, [camelized]: nested } as any;
    }

    if (typeof value === 'object') {
      const nested = camelizeKeys(value);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...acc, [camelized]: nested } as any;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...acc, [camelized]: value } as any;
  }, {} as object);
}

export function underscoreKeys(input: object): object {
  if (typeof input !== 'object') {
    return input;
  }

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
