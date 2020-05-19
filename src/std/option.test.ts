import { fromNullable } from '@krumpled/krumi/std/option';
import { describe, expect, it as test } from '@jest/globals';

describe('Option', function () {
  describe('fromNullable', function () {
    test('correct values', function () {
      const opt = fromNullable(null);
      expect(opt.kind).toBe('none');
    });
  });
});
