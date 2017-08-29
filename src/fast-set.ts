const BITS_PER_NUMBER = Math.log(Number.MAX_SAFE_INTEGER) / Math.log(2);

export class FastSet {
  /**
   * The array of numbers represeting a bit vector of potentially infinite length.
   */
  public readonly vectors: Array<number>;

  /**
   * The number of values in the set.
   */
  private size: number;

  get capacity(): number {
    return this.vectors.length * BITS_PER_NUMBER;
  }

  /**
   * Construct a new FastSet.
   */
  constructor(values: number[] = []) {
    this.vectors = [0];
    this.size = 0;
    values.forEach(value => this.add(value));
  }

  /**
   * Returns a hexidecimal hash key string that represents the total set
   * membership. This string key can be stored in a hash table and used to
   * establish equality between sets. For example, in subset construction we
   * could determine in O(1) time if a set is a subset of a larger set by
   * storing the subset keys in a hash table (the superset).
   */
  public toHashKey() {
    return this.vectors.map(vector => vector.toString(16)).join('');
  }

  /**
   * Add a value to the set.
   */
  public add(value: number): FastSet {
    let added = this.on(value);

    if (added) {
      this.size++;
    }

    return this;
  }

  /**
   * Remove a value from the set.
   */
  public remove(value: number): FastSet {
    let removed = this.off(value);

    if (removed) {
      this.size--;
    }

    return this;
  }

  /**
   * Returns a new set containing the intersection with the other set.
   */
  public intersection(other: FastSet): FastSet {
    return this.operation(other, (vector, otherVector) => vector & otherVector);
  }

  /**
   * Returns a new set containing the union with the other set.
   */
  public union(other: FastSet): FastSet {
    return this.operation(other, (vector, otherVector) => vector | otherVector);
  }

  /**
   * Returns a new set containing the difference between this set and the other
   * set (all values in this set but not in the other set).
   */
  public difference(other: FastSet) {
    return this.operation(other, (vector, otherVector) => vector & ~otherVector);
  }

  /**
   * Perform a bitwise operation on each vector in the set, returning a new
   * FastSet with the resulting values.
   *
   * @returns A new FastSet containing the values from performing the operation.
   */
  private operation(other: FastSet, callback: (vector: number, otherVector: number) => number) {
    let values: number[] = [];

    for (let i = 0; i < this.vectors.length; i++) {
      if (i >= other.vectors.length) {
        break;
      }

      let thisVector = this.vectors[i];
      let otherVector = other.vectors[i];

      // get the result from providing both numbers to the callback.
      let result = callback(thisVector, otherVector);

      let bitIndex = 0;

      while (result > 0) {
        if ((result & 1) === 1) {
          // the value is the current bit index in the current value + the
          // offset of whatever vector it's in.
          let offset = i * BITS_PER_NUMBER;
          values.push(offset + bitIndex);
        }
      }
    }

    return new FastSet(values);
  }

  /**
   * Turn on the bit for the given value (i.e. flip to 1).
   *
   * @returns Returns true if the bit was changed. Returns false if it was
   * already on.
   */
  private on(value) {
    this.maybeGrowVectors(value);

    let vectorIndex = this.getVectorIndex(value);
    let vector = this.vectors[vectorIndex];

    // we need to find the position of the value inside this specific vector
    // which is n vectors into the vectors list. So we'll figure out the index
    // of the value mod the size of a vector (58 bits in javascript).
    let bitIndex = value % BITS_PER_NUMBER;

    // get the value of the existing bit.
    let bit = this.getBit(vector, bitIndex);

    // if the bit is 0 then flip it and return true to indicate we changed the
    // bit.
    if (bit === 0) {
      // now make sure the bit at the bitIndex is set to 1.
      let mask = (1 << bitIndex);
      vector |= mask;
      return true;
    }

    // otherwise return false to indicate we didn't change the bit.
    return false;
  }

  /**
   * Turn off the bit for the given value (i.e. flip to 0).
   *
   * @returns Returns true if the bit was changed. Returns false if it was
   * already off.
   */
  private off(value) {
    let vectorIndex = this.getVectorIndex(value);

    if (vectorIndex < this.vectors.length) {
      let vector = this.vectors[vectorIndex];
      let bitIndex = value % BITS_PER_NUMBER;
      let bit = this.getBit(vector, bitIndex);

      if (bit === 1) {
        let mask = ~vector | (0 << bitIndex);
        vector &= mask;
        // return true to indicate we changed the bit.
        return true;
      }
    }

    // return false to indicate we did not change the bit.
    return false;
  }

  /**
   * Grow the vectors array as needed to accomodate a new value. This doubles
   * the capacity with each growth step. Therefore, if the values being added
   * to the set are sequential we will get O(1) amortized time to add a value.
   */
  private maybeGrowVectors(value) {
    // create empty vectors as needed to accomodate the new position.
    while (value > this.capacity) {
      // each time we increase the size of the vectors, increase it by a factor
      // of 2. this way, if we use sequential keys we can get almost O(1)
      // amortized time to add a new element.
      let factor = 2 * this.vectors.length;

      for (let i = 0; i < factor; i++) {
        // grow the vectors array
        this.vectors.push(0);
      }
    }
  }

  private getVectorIndex(value) {
    return Math.floor(value / BITS_PER_NUMBER);
  }

  private getBit(vector, index) {
    let mask = 1 << index;
    return (vector & mask) > 0 ? 1 : 0;
  }
}