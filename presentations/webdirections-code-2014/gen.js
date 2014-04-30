// some asynchronous function, could be anything conforming to the normal node callpath pattern

function timer (callback) {
  setTimeout(function () {
    callback(null, new Date())
  }, 1000)
}

// Linear congruential pseudo random number generator
function* random (seed) {
  while (true) {
  var m = 25, a = 11, c = 17, z = seed;
    z = (a * z + c) % m;
    yield z;
  }
}

function* random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  while (true) {
    z = (a * z + c) % m;
    seed = yield z;
    if (typeof seed == 'number')
      z = seed
  }
}

console.log('gen')
var gen = random(Date.now())
for (var i = 0; i < 10; i++)
  console.log(gen.next().value)
console.log()

var s = Date.now()
var gen = random(s)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log('seed', s)
console.log(gen.next(s).value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)
console.log(gen.next().value)

// generator that yields async functions as a way of performing work

function* gengen () {
  var v1 = yield timer
  console.log('v1', v1)
  var v2 = yield timer
  console.log('v2', v2)
  var v3 = yield timer
  console.log('v3', v3)
  return 'all done'
}

// a pre-ES6 version of the generator confirming to the general protocol

function fakegen () {
  var c = 0
  return {
    next: function (arg) {
      c++
      switch (c) {
        case 1:
          return { value: timer };
        case 2:
          console.log('v1', arg)
          return { value: timer };
        case 3:
          console.log('v2', arg)
          return { value: timer };
        case 4:
          console.log('v2', arg)
          return { done: true, value: 'all done' };
      }
    }
  }
}

// generator async runner, simplistic form of 'co'

function run (fn) {
  var gen = fn();
  (function next (arg) {
    var it = gen.next(arg)
    console.log('got', it, 'passed', arg)
    if (it.done)
      return console.log('done', it.value)

    it.value(function (err, data) {
      next(data);
    })
  }())
}

// execute the generator function (uncomment one)

//run(fakegen)
run(gengen);

