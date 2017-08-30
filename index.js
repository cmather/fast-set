var { FastSet } = require('.');

var set = new FastSet();

for (var i = 0; i < 100; i++) {
  set.add(i);
}

console.log(set);
