"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// note: even though javascript uses 53 bits for a number, the bitwise operators
// only support 32 bits. The most significant bit is the sign bit, so we'll only
// use the lower 31 bits.
exports.BITS_PER_NUMBER = 31;
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
        /**
         * The total capacity for values. This will be all the bits available across
         * all of the vectors.
         */
        get: function () {
            return this.vectors.length * exports.BITS_PER_NUMBER;
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
        // copy the vectors buffer so we can mutate the copy
        var vectors = this.vectors.slice();
        // pop off all of the 0s from the end since these don't hold values.
        while (vectors[vectors.length - 1] === 0) {
            vectors.pop();
        }
        // map over the vector numbers and convert to base16 hex strings joined
        // together.
        var result = [];
        // reading the vectors from left to right, push them onto the result from
        // right to left to represent a concatenated number.
        vectors.forEach(function (vector) { return result.unshift(vector.toString(16)); });
        return result.join('');
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
        var maxVectorsLength = Math.max(this.vectors.length, other.vectors.length);
        for (var i = 0; i < maxVectorsLength; i++) {
            if (i >= other.vectors.length) {
                break;
            }
            var thisVector = this.vectors[i] || 0;
            var otherVector = other.vectors[i] || 0;
            // get the result from providing both numbers to the callback.
            var result = callback(thisVector, otherVector);
            var bitIndex = 0;
            while (result > 0) {
                if ((result & 1) === 1) {
                    // the value is the current bit index in the current value + the
                    // offset of whatever vector it's in.
                    var offset = i * exports.BITS_PER_NUMBER;
                    values.push(offset + bitIndex);
                }
                // XXX should this be >>>=1 or >>=1?
                result >>>= 1;
                bitIndex++;
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
        // of the value mod the size of a vector (53 bits in javascript).
        var bitIndex = value % exports.BITS_PER_NUMBER;
        // get the value of the existing bit.
        var bit = this.getBit(vector, bitIndex);
        // if the bit is 0 then flip it and return true to indicate we changed the
        // bit.
        if (bit === '0') {
            // now make sure the bit at the bitIndex is set to 1.
            var mask = (1 << bitIndex);
            vector |= mask;
            this.vectors[vectorIndex] = vector;
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
            var bitIndex = value % exports.BITS_PER_NUMBER;
            var bit = this.getBit(vector, bitIndex);
            if (bit === '1') {
                var mask = ~vector | (0 << bitIndex);
                vector &= mask;
                this.vectors[vectorIndex] = vector;
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
    /**
     * Gets the index into the vectors buffer for the given value. For example, if
     * the value is <= 52 the index will be 0 because the first 0-52 (53 total) bits are stored
     * in the first number in the vectors buffer. If the value is 53 that will be
     * at index 1, etc.
     */
    FastSet.prototype.getVectorIndex = function (value) {
        return Math.floor(value / exports.BITS_PER_NUMBER);
    };
    /**
     * Get the bit value at the given index in the vector number.
     */
    FastSet.prototype.getBit = function (vector, index) {
        var mask = 1 << index;
        return (vector & mask) > 0 ? '1' : '0';
    };
    return FastSet;
}());
exports.FastSet = FastSet;
