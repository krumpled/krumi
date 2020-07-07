import {
  Option,
  fromNullable,
  fuse as fuseOption,
  map as mapOption,
  or as orOption,
  mapAsync as mapOptionAsync,
  unwrapOr as unwrapOptionOr,
  none,
  some,
} from '@krumpled/krumi/std/option';
import { Result, asPromise as resultToPromise, ok, err, map as mapResult } from '@krumpled/krumi/std/result';
import { AsyncRequest, loading, loaded, notAsked, failed } from '@krumpled/krumi/std/async-request';

export function ready<T>(data: T, delay?: number): Promise<T> {
  return new Promise((resolve) => {
    if (delay) {
      return setTimeout(() => resolve(data), delay);
    }
    return resolve(data);
  });
}

export function always<T>(item: T): () => T {
  return (): T => item;
}

function separateWords(input: string, options?: { separator?: string; split?: string }): string {
  const separator = options?.separator || '_';
  const split = options?.split || /(?=[A-Z])/;
  return input.split(split).join(separator);
}

function camelize(input: string): string {
  const replaced = input.replace(/[-_\s]+(.)?/g, (_match, chr) => (chr || '').toUpperCase());
  return replaced.substr(0, 1).toLowerCase() + replaced.substr(1);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function camelizeKeys(input: any): any {
  if (typeof input !== 'object') {
    return input;
  }

  if (typeof input === 'string') {
    return camelize(input);
  }

  if (!input) {
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

    // eslint-disable-next-line @typescript-eslint/ban-types
  }, {} as object);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function underscoreKeys(input: any): any {
  if (typeof input !== 'object') {
    return input;
  }

  if (typeof input === 'string') {
    const underscored = separateWords(input).toLowerCase();
    return underscored;
  }

  if (!input) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(underscoreKeys(input));
  }

  return Object.keys(input).reduce((acc, k) => {
    const underscored = separateWords(k).toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/ban-types
    return { ...acc, [underscored]: (input as any)[k] } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/ban-types
  }, {} as object);
}

export function findQueryValue(key: string, search: string): Option<Array<string>> {
  const parts = search.charAt(0) === '?' ? search.substr(1).split('&') : search.split('&');
  const mappings = parts.reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) {
      return acc;
    }
    const previous = acc[key] || [];
    return { ...acc, [key]: [...previous, value] };
  }, {} as Record<string, Array<string>>);
  return fromNullable(mappings[key]);
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

// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
export function noop(...swallowed: Array<unknown>): void {}

export function flattenOptions<T>(input: Array<Option<T>>): Array<T> {
  return input.reduce((acc, item) => (item.kind === 'some' ? [...acc, item.data] : acc), new Array<T>());
}

export function getAsyncRequestPromise<T>(request: AsyncRequest<T>): Option<Promise<T>> {
  return request.kind === 'loading' ? some(request.promise) : none();
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
  unwrapOptionOr,
  mapOptionAsync,
  fuseOption,
  orOption,
  resultToPromise,
};
