import { Option, fromNullable, none, some } from '@krumpled/krumi/std/option';
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
};
