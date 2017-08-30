FastSet
===============================================================================
An bit vector implementation of sets that allows almost O(1) equality checks and
set operations between sets.

## Usage
```javascript
let setA = new FastSet();
setA.add(0).add(1).add(2);

let setB = new FastSet();
setB.add(1).add(2).add(3);

setA.union(setB); // => new FastSet([1, 2])

setA.difference(setB); // => new FastSet([0])

setA.intersect(setB); // => new FastSet([1, 2])

setA.equals(new FastSet([0, 1, 2])); // => true
```
