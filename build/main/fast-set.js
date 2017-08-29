"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BITS_PER_NUMBER = Math.log(Number.MAX_SAFE_INTEGER) / Math.log(2);
var FastSet = (function () {
    /**
     * Construct a new FastSet.
     */
    function FastSet(values) {
        if (values === void 0) { values = []; }
        var _this = this;
        this.vectors = [0];
        this.size = 0;
        values.forEach(function (value) { return _this.add(value); });
    }
    Object.defineProperty(FastSet.prototype, "capacity", {
        get: function () {
            return this.vectors.length * BITS_PER_NUMBER;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns a hexidecimal hash key string that represents the total set
     * membership. This string key can be stored in a hash table and used to
     * establish equality between sets. For example, in subset construction we
     * could determine in O(1) time if a set is a subset of a larger set by
     * storing the subset keys in a hash table (the superset).
     */
    FastSet.prototype.toHashKey = function () {
        return this.vectors.map(function (vector) { return vector.toString(16); }).join('');
    };
    /**
     * Add a value to the set.
     */
    FastSet.prototype.add = function (value) {
        var added = this.on(value);
        if (added) {
            this.size++;
        }
        return this;
    };
    /**
     * Remove a value from the set.
     */
    FastSet.prototype.remove = function (value) {
        var removed = this.off(value);
        if (removed) {
            this.size--;
        }
        return this;
    };
    /**
     * Returns a new set containing the intersection with the other set.
     */
    FastSet.prototype.intersection = function (other) {
        return this.operation(other, function (vector, otherVector) { return vector & otherVector; });
    };
    /**
     * Returns a new set containing the union with the other set.
     */
    FastSet.prototype.union = function (other) {
        return this.operation(other, function (vector, otherVector) { return vector | otherVector; });
    };
    /**
     * Returns a new set containing the difference between this set and the other
     * set (all values in this set but not in the other set).
     */
    FastSet.prototype.difference = function (other) {
        return this.operation(other, function (vector, otherVector) { return vector & ~otherVector; });
    };
    /**
     * Perform a bitwise operation on each vector in the set, returning a new
     * FastSet with the resulting values.
     *
     * @returns A new FastSet containing the values from performing the operation.
     */
    FastSet.prototype.operation = function (other, callback) {
        var values = [];
        for (var i = 0; i < this.vectors.length; i++) {
            if (i >= other.vectors.length) {
                break;
            }
            var thisVector = this.vectors[i];
            var otherVector = other.vectors[i];
            // get the result from providing both numbers to the callback.
            var result = callback(thisVector, otherVector);
            var bitIndex = 0;
            while (result > 0) {
                if ((result & 1) === 1) {
                    // the value is the current bit index in the current value + the
                    // offset of whatever vector it's in.
                    var offset = i * BITS_PER_NUMBER;
                    values.push(offset + bitIndex);
                }
            }
        }
        return new FastSet(values);
    };
    /**
     * Turn on the bit for the given value (i.e. flip to 1).
     *
     * @returns Returns true if the bit was changed. Returns false if it was
     * already on.
     */
    FastSet.prototype.on = function (value) {
        this.maybeGrowVectors(value);
        var vectorIndex = this.getVectorIndex(value);
        var vector = this.vectors[vectorIndex];
        // we need to find the position of the value inside this specific vector
        // which is n vectors into the vectors list. So we'll figure out the index
        // of the value mod the size of a vector (58 bits in javascript).
        var bitIndex = value % BITS_PER_NUMBER;
        // get the value of the existing bit.
        var bit = this.getBit(vector, bitIndex);
        // if the bit is 0 then flip it and return true to indicate we changed the
        // bit.
        if (bit === 0) {
            // now make sure the bit at the bitIndex is set to 1.
            var mask = (1 << bitIndex);
            vector |= mask;
            return true;
        }
        // otherwise return false to indicate we didn't change the bit.
        return false;
    };
    /**
     * Turn off the bit for the given value (i.e. flip to 0).
     *
     * @returns Returns true if the bit was changed. Returns false if it was
     * already off.
     */
    FastSet.prototype.off = function (value) {
        var vectorIndex = this.getVectorIndex(value);
        if (vectorIndex < this.vectors.length) {
            var vector = this.vectors[vectorIndex];
            var bitIndex = value % BITS_PER_NUMBER;
            var bit = this.getBit(vector, bitIndex);
            if (bit === 1) {
                var mask = ~vector | (0 << bitIndex);
                vector &= mask;
                // return true to indicate we changed the bit.
                return true;
            }
        }
        // return false to indicate we did not change the bit.
        return false;
    };
    /**
     * Grow the vectors array as needed to accomodate a new value. This doubles
     * the capacity with each growth step. Therefore, if the values being added
     * to the set are sequential we will get O(1) amortized time to add a value.
     */
    FastSet.prototype.maybeGrowVectors = function (value) {
        // create empty vectors as needed to accomodate the new position.
        while (value > this.capacity) {
            // each time we increase the size of the vectors, increase it by a factor
            // of 2. this way, if we use sequential keys we can get almost O(1)
            // amortized time to add a new element.
            var factor = 2 * this.vectors.length;
            for (var i = 0; i < factor; i++) {
                // grow the vectors array
                this.vectors.push(0);
            }
        }
    };
    FastSet.prototype.getVectorIndex = function (value) {
        return Math.floor(value / BITS_PER_NUMBER);
    };
    FastSet.prototype.getBit = function (vector, index) {
        var mask = 1 << index;
        return (vector & mask) > 0 ? 1 : 0;
    };
    return FastSet;
}());
exports.FastSet = FastSet;
