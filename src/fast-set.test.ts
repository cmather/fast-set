import * as assert from 'assert';
import { FastSet, BITS_PER_NUMBER } from './fast-set';

describe('FastSet', function() {
  describe('#constructor()', function() {
    it('should construct', function() {
      let set = new FastSet;
      assert(set);
    });

    it('should allow passing values', function() {
      let set = new FastSet([0,1,2]);
      assert.equal(set.size, 3, 'values not added to set in constructor');
    });
  });

  describe('adding and removing set elements', function() {
    describe('#add()', function() {
      it('should allow adding values to the set', function() {
        let set = new FastSet;

        set.add(0);
        assert.equal(set.size, 1, 'wrong vector size');
        assert.equal(set.vectors[0], 1, 'wrong vector value');

        set.add(1);
        assert.equal(set.size, 2, 'wrong vector size');
        assert.equal(set.vectors[0], 3, 'wrong vector value');

        set.add(2);
        assert.equal(set.size, 3, 'wrong vector size');
        assert.equal(set.vectors[0], 7, 'wrong vector value');
      });

      it('should work if value is larger than one vector', function() {
        let set = new FastSet;
        set.add(31);

        assert.equal(set.size, 1, 'wrong vector size');
        // note: it's 3 instead of 2 because it grows by 2x each time to achieve
        // amortized O(1) add time for sequential numbers.
        assert.equal(set.vectors.length, 2, 'vectors length did not grow');
        assert.equal(set.capacity, 2 * 31, 'vectors capcity did not grow');
        assert.equal(set.vectors[1], 1, 'wrong vector value');

        set.add(0);
        assert.equal(set.size, 2, 'wrong vector size');
        assert.equal(set.capacity, 2 * 31, 'vectors capcity did not stay same');
      });

      it('should not add the same value twice', function() {
        let set = new FastSet;

        set.add(0);
        assert.equal(set.size, 1, 'wrong vector size');
        assert.equal(set.vectors[0], 1, 'wrong vector value');

        set.add(0);
        assert.equal(set.size, 1, 'wrong vector size');
        assert.equal(set.vectors[0], 1, 'wrong vector value');
      });
    });

    describe('#remove()', function() {
      it('should remove values from the set', function() {
        let set = new FastSet;

        set.add(0);
        assert.equal(set.size, 1, 'wrong vector size');
        assert.equal(set.vectors[0], 1, 'wrong vector value');

        set.remove(0);
        assert.equal(set.size, 0, 'wrong vector size');
        assert.equal(set.vectors[0], 0, 'wrong vector value');
      });
    });
  });

  describe('set operations', function() {
    describe('#union()', function() {
      it('should return the union of two sets', function() {
        let setA = new FastSet([0,1,2]);
        let setB = new FastSet([1,2,3]);
        let result = setA.union(setB);
        assert(result instanceof FastSet, 'union should return a FastSet');
        assert.equal(result.vectors[0], 15, 'wrong vector value for union');
        assert.equal(result.size, 4, 'wrong size for result');
      });

      it('should work when one FastSet is larger than another', function() {
        let setA = new FastSet([0]);
        let setB = new FastSet([31]);
        let result = setA.union(setB);
        assert.equal(result.vectors[0], 1, 'wrong vector value for union');
        assert.equal(result.vectors[1], 1, 'wrong vector value for union');
        assert.equal(result.size, 2, 'wrong size for result');
      });
    });

    describe('#intersection()', function() {
      it('should return the intersection of two sets', function() {
        let setA = new FastSet([0,1,2]);
        let setB = new FastSet([1,2,3]);
        let result = setA.intersection(setB);
      });

      it('should work when on FastSet is larger than another', function() {
        let setA = new FastSet([0]);
        let setB = new FastSet([0, 53]);
        let result = setA.intersection(setB);
        assert.equal(result.vectors[0], 1, 'wrong vector value');
        assert.equal(result.size, 1, 'wrong size for result');
      });
    });

    describe('#difference()', function() {
      it('should return the difference of two sets', function() {
        let setA = new FastSet([0,1]);
        let setB = new FastSet([1,2]);
        let result = setA.difference(setB);
        assert.equal(result.vectors[0], 1, 'wrong vector value');
        assert.equal(result.size, 1, 'wrong size for result');
      });

      it('should work when on FastSet is larger than another', function() {
        let setA = new FastSet([1]);
        let setB = new FastSet([0, 53]);
        let result = setA.difference(setB);
        assert.equal(result.vectors[0], 2, 'wrong vector value');
        assert.equal(result.size, 1, 'wrong size for result');
      });
    });

    describe('#toHashKey()', function() {
      it('should return a hex key representing the set membership', function() {
        let setA = new FastSet([0, 35]);
        let key = setA.toHashKey();

        let expected = [
          Math.pow(2, 35 % 31).toString(16),
          (1).toString(16)
        ].join('');

        assert.equal(key, expected, 'wrong hash key');
      });
    });
  });
});
