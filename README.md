FastSet
===============================================================================
An n-dimensional bit vector implementation of sets that allows almost O(1)
equality checks between sets.

The speed comes from the fact that we can compare up to 58 values (max int size
number of bits) in one machine instruction using the bit-wise '&' operator on
two numbers. If we have more than 58 values in the set the vector buffer will
grow automatically. Set membership and set equality (based on set membership)
can be determined in almost O(|v|) time where |v| is the number of 58 bit
vectors (numbers) stored in the FastSet.

## Usage
```javascript
let setA = new FastSet();
setA.add(0).add(1).add(2);

let setB = new FastSet();
setB.add(1).add(2).add(3);

// union O(|v|)
setA.union(setB); // => new FastSet([1, 2])

// difference O(|v|)
setA.difference(setB); // => new FastSet([0])

// intersection O(|v|)
setA.intersect(setB); // => new FastSet([1, 2])

// equality O(|v|)
setA.equals(new FastSet([0, 1, 2])); // => true
```
