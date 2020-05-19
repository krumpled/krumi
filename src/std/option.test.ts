import { fromNullable } from '@krumpled/krumi/std/option';
import { describe, expect, it as test } from '@jest/globals';

describe('Option', function () {
  describe('fromNullable', function () {
    test('correct values', function () {
      expect(fromNullable(null).kind).toBe('none');
      expect(fromNullable(undefined).kind).toBe('none');
      expect(fromNullable('please-dont-be-in-build').kind).toBe('some');
    });
  });
});
