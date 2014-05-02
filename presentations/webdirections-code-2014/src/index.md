
# Asynchronous JavaScript Patterns
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# *Embrace the Async*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## @rvagg<br>Rod Vagg

<br>

<p style="text-align: center; padding-top: 5px;"><img src="img/erik.png" alt="Erik" style="width: 50px; border-radius: 5px; box-shadow: 0px 0px 7px rgba(0,0,0,0.4);"></p>

<p style="text-align: center; padding-top: 5px;"><img src="img/milkyjoe.jpeg" alt="Milky Joe" style="width: 50px; border-radius: 5px; box-shadow: 0px 0px 7px rgba(0,0,0,0.4);"></p>

<br>

<p style="text-align: center;">
  <a href="http://r.va.gg">http://r.va.gg</a><br>
  <a href="http://nodefirm.com">http://nodefirm.com</a>
</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## TOC

Defining *"asynchronous programming"*

Constructing basic async abstractions: each, map, series

Advanced abstractions

* EventEmitter
* Streams
* Promises

Generators for async programming

*Ranty stuff*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## In the begining

<br>

Programming was about *computing*

Computers were self-contained number-crunchers

I/O was late to the game

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is not *computing*

<br>

I/O is what computers wait for

I/O is the bottleneck in the majority of programs

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is usually hidden

```java
System.out.println("Reading file...");
BufferedReader br = new BufferedReader(new FileReader("in.txt"));

try {
  StringBuilder sb = new StringBuilder();
  String line;

  while ((line = br.readLine()) != null)
    sb.append(line + "\n");
  System.out.print(sb.toString());
} finally {
  br.close();
}

System.out.println("Finished reading file!");
```

The programmer isn't prompted to consider the costs

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is expensive

<style>
table#iocost {
  font-size: 15px;
  margin: 20px auto;
}
table#iocost td, table#iocost th {
  padding: 4px 12px;
  margin: 0;
  border-bottom: #333 solid 1px;
}
</style>

<table id="iocost" cellpadding="0" cellspacing="0">
  <thead>
    <tr><th>Class</th><th>Operation</th><th>Time cost</th></tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3" style="text-align: center;">Memory</td>
      <td>L1 cache reference:</td>
      <td style="text-align: right;">1 ns</td>
    </tr>
    <tr>
      <td>L2 cache reference:</td>
      <td style="text-align: right;">4 ns</td>
    </tr>
    <tr>
      <td>Main memory reference:</td>
      <td style="text-align: right;">100 ns</td>
    </tr>
    <tr>
    <tr>
      <td rowspan="4" style="text-align: center;">I/O</td>
      <td>SSD random-read:</td>
      <td style="text-align: right;">16,000 ns</td>
    </tr>
    <tr>
      <td>Round-trip in same datacenter:</td>
      <td style="text-align: right;">500,000 ns</td>
    </tr>
    <tr>
      <td>Physical disk seek:</td>
      <td style="text-align: right;">4,000,000 ns</td>
    </tr>
    <tr>
      <td>Round-trip from AU to US:</td>
      <td style="text-align: right;">150,000,000 ns</td>
    </tr>
  </tbody>
</table>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The UI introduced new challenges

<br>

I/O in the form of a human

Unpredictable

*Very* high latency

Sequential programming has limits

Good UIs don't constrain the user

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Networked UIs: a perfect storm

<br>

User variability delivered over unreliable, high-latency networks

Browsers...

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## On the web, nothing is synchronous

<br>

Always in *reactive* mode, responding to external events

 * React to user events
 * React to network events
 * React to browser events

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## JavaScript:<br>The King of event-driven programming

Born in the browser

Designed to respond to user-events

**Timers!** &nbsp; <span id="scroll">BREAKING NEWS: Scrolling text with DHTML!         </span>

<script>
var p = document.getElementById('scroll');
function scroll () {
  var ptxt = p.innerHTML.replace(/&nbsp;/g, ' ').split('');
  ptxt.push(ptxt.shift());
  p.innerHTML = ptxt.join('').replace(/ /g, '&nbsp;');
}
setInterval(scroll, 100)
</script>

```js
var p = document.getElementById('scroll');
function scroll () {
  var ptxt = p.innerHTML.replace(/&nbsp;/g, ' ').split('');
  ptxt.push(ptxt.shift());
  p.innerHTML = ptxt.join('').replace(/ /g, '&nbsp;');
}
setInterval(scroll, 100)
```

<p style="font-size: 10px; font-style: italic;">Warning: content may trigger intense feelings of nostalgia</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## JavaScript:<br>The King of event-driven programming

<br>

* First-class functions

* Closures and scope capturing

* *Single-threaded*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronicity at the extreme: Node.js

<br>

Async works well for performing many complex, parallel tasks in the browser, why not on the server too?

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Synchronous I/O with Node.js

Synchronous file system I/O, on the JavaScript thread

```js
console.log('Reading data...');
var data = fs.readFileSync('in.dat');
console.log('Finished reading data!');
```

*Don't do this*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous I/O with Node.js

File system I/O is performed on a thread-pool when asynchronous

```js
console.log('Reading data...');
fs.readFile('in.dat', function (err, data) {
  // asynchronous
  console.log('Finished reading data!');
})
console.log('Not finished reading data...');
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous I/O with Node.js

<br>

Network I/O performed with non-blocking system calls

`epoll` or `select` depending on platform

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous I/O with Node.js

Network I/O, always asynchronous, generally event-based

```js
var server = http.createServer()

server.on('request', function (request, response) {
  // handle HTTP request
});
server.on('clientError', function () { /* ... */ }});
server.on('error', function () { /* ... */ }});
server.on('close', function () {
  console.log('Server shut down');
})
server.on('listening', function () {
  console.log('Listening on port 8080');
});

server.listen(8080);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The *callback*

JavaScript embraces the **continuation passing** style

```js
console.log('Ping!');
function pong () { console.log('Pong!'); }
setTimeout(pong, 100);
```

```js
console.log('Reading file...');
fs.readFile('in.dat', 'utf8', function (err, data) {
  console.log('in.dat contains %d lines', data.split('\n').length);
});
```

```js
function clickHandler () { alert('Yo!'); }
el.addEventListener('click', clickHandler, false);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The *callback*

The *callback* function is the fundamental unit of asynchronous programming in JavaScript

* DOM events
* Browser-based networking
* Basic Node.js I/O operations
* Node.js EventEmitter
* Streams

Even *Promises* and async utilities for generators are built on callbacks

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

Example: a program to `ls -ta`

Tools:

```js
// list files in a directory
fs.readdir(directory, function (err, fileList) { /* ... */ });

// perform a `stat` on a file
fs.stat(filename, function (err, stat) { /* ... */ });
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v1: print the modification times of each file
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;

  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (err) return console.error('Error stating %s', file);

      console.log('%s: %s', file, stat.mtime);
    });
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v2: collect modification times
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;

  var times = {};
  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (err) return console.error('Error stating %s', file);

      times[file] = stat.mtime;
      console.log(times);
      // now what?
    });
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v3: collect modification times and count callbacks
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;

  var times = {}, count = 0;
  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (err) {
        console.error('Error stating %s', file);
      } else {
        times[file] = stat.mtime;
      }
      if (++count === fileList.length)
        console.log(times);
    });
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v4: collect modification times, count callbacks, sort and print
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;
  var times = {}, count = 0;
  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (!err) times[file] = stat.mtime;
      if (++count === fileList.length) {
        fileList.sort(function (a, b) {
          if (times[a] > times[b]) return -1;
          if (times[a] < times[b]) return 1;
          return 0;
        });
        console.log(fileList.join('\n'));
      }
    });
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v5: reorganise
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;
  var times = {}, count = 0;
  function sortFn (a, b) {
    return times[a] > times[b] ? -1 : times[a] < times[b] ? 1 : 0;
  }
  function sortAndPrint () {
    console.log(fileList.sort(sortFn).join('\n'));
  }
  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (!err) times[file] = stat.mtime;
      if (++count === fileList.length) sortAndPrint();
    })
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// a handy utility!
function counter (limit, callback) {
  var count = 0;
  return function () {
    count++;
    if (count === limit)
      callback();
  }
}
```

```js
var done = counter(4, function () {
  console.log('DONE!');
});
done();
done();
done();
done();
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// v6: introduce counting abstraction
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;
  var times = {};
  var done = counter(fileList.length, sortAndPrint);
  function sortFn (a, b) {
    return times[a] > times[b] ? -1 : times[a] < times[b] ? 1 : 0;
  }
  function sortAndPrint () {
    console.log(fileList.sort(sortFn).join('\n'));
  }
  fileList.forEach(function (file) {
    fs.stat(dir + '/' + file, function (err, stat) {
      if (!err) times[file] = stat.mtime;
      done();
    })
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: callback counting

```js
// with error handling
function counter (limit, callback) {
  var count = 0;
  var borked = false;
  return function (err) {
    if (borked) return;
    if (err) {
      borked = true;
      return callback(err);
    }
    count++;
    if (count === limit)
      callback();
  }
}
```

<https://github.com/Raynos/after>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: asynchronous map

```js
// synchronous ES5 Array#map()

[ 1, 2, 3 ].map(function (el) {
  return el * 10;
});

// -> [ 10, 20, 30 ]
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: asynchronous map

```js
// Array#map() for async!
function asyncMap (arr, workCallback, callback) {
  var result = [];
  var done = counter(arr.length, function (err) {
    if (err) return callback(err);
    callback(null, result);
  });
  arr.forEach(function (el, i) {
    workCallback(el, function (err, elResult) {
      if (err) return done(err);
      result[i] = elResult;
      done();
    });
  });
}
```

<https://github.com/Raynos/map-async>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: asynchronous map

*Example usage:*

```js
/* Array#map version:
console.log([ 1, 2, 3 ].map(function (el) {
  return el * 10;
}));
*/

asyncMap(
  [ 1, 2, 3 ],
  function (el, callback) {
    callback(null, el * 10);
  },
  function (err, result) {
    console.log(result);
  }
);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: asynchronous map

```js
// v7: introduce async map abstraction, remove all explicit state
fs.readdir(dir, function (err, fileList) {
  if (err) throw err;
  function sortAndPrint (err, fileTimes) {
    fileTimes.sort(function (a, b) {
      return a.time > b.time ? -1 : a.time < b.time ? 1 : 0;
    });
    fileTimes.forEach(function (fileTime) {
      console.log(fileTime.file);
    });
  }
  function statFile (file, callback) {
    fs.stat(dir + '/' + file, function (err, stat) {
      callback(null, { file: file, time: stat ? stat.mtime : 0 });
    });
  }
  asyncMap(fileList, statFile, sortAndPrint);
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

Example: concat multiple files into a single file

Tools:

```js
// read the contents of a file into a String or Buffer
fs.readFile(filename, encoding, function (err, data) { /* ... */ });

// append a String or Buffer to a file
fs.appendFile(filename, buffer, function (err) { /* ... */ });
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v1: naive version, read and write each file
files.forEach(function (file) {
  fs.readFile(file, 'utf8', function (err, contents) {
    if (err) throw err;

    fs.appendFile(output, contents, function (err) {
      if (err) throw err;
    })
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v2: process files one at a time
function catFile (file, callback) {
  fs.readFile(file, 'utf8', function (err, contents) {
    if (err) return callback(err);
    fs.appendFile(output, contents, callback);
  });
}
function next (index) {
  if (index >= files.length)
    return console.log('Done!');
  catFile(files[index], function (err) {
    if (err) throw err;
    next(index + 1);
  })
}
next(0);
```

<p style="font-size: 10px;"><a href="https://github.com/hughsk/async-series">https://github.com/hughsk/async-series</a></p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions

<br>

* EventEmitter

* Streams

* Promises

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

<br>

Sometimes a single callback isn't enough

* Multiple calls
* Multiple types of responses
* Communicate complex state

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

```js
// in Node.js
var EventEmitter = require('events').EventEmitter;

var ee = new EventEmitter();
ee.on('ping', function () {
  console.log('pong');
})
ee.emit('ping');
```

`on()`, `once()`, `emit()`, `removeListener()`, `removeAllListeners()`

One surprise: `'error'` event

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

```js
// sometimes an API should return an EventEmitter
var server = http.createServer()

server.on('request', function (request, response) {
  // handle HTTP request
});
server.on('clientError', function () { /* ... */ }});
server.on('error', function () { /* ... */ }});
server.on('close', function () {
  console.log('Server shut down');
});
server.on('listening', function () {
  console.log('Listening on port 8080');
});

server.listen(8080);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Streams

#### For

* Chunked I/O
* Chunked data processing

#### Why?

* Abstraction suited to flowing data: plumbing
* Process very large amounts of data with minimal memory
* Process many asynchronous streams of data simultaneously
* Push output data before input data has completed
* **Backpressure**

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Streams

```js
var request = require('request');
var json = require('JSONStream');
var through2 = require('through2');
var csv = require('csv-write-stream');
var zlib = require('zlib');
var fs = require('fs');
 
request({ url: 'https://registry.npmjs.org/-/all' }) // ~35M raw
  .pipe(json.parse('*'))
  .pipe(through2.obj(function (data, enc, callback) {
    if (data.name && data.description)
      this.push({ name: data.name, description: data.description })
    callback()
  }))
  .pipe(csv({ headers: [ 'name', 'description' ] }))
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('npm.csv.gz'))
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

<br>

An abstraction with a very well-defined API

Promises/A+ <http://promisesaplus.com/>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

<br>

An object with a `then()` method as a hook in to the state and data represented by the *Promise*

Three states: pending, fulfilled, rejected

`promise.then(onFulfilled, onRejected)`

Composable

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

<p class="shrink"></p>

```js
var q = require('q');
var preaddir = q.denodeify(fs.readdir);
var pstat = q.denodeify(fs.stat);

function sortAndPrint (fileTimes) {
  fileTimes.sort(function (a, b) {
    return a.time > b.time ? -1 : a.time < b.time ? 1 : 0;
  });
  fileTimes.forEach(function (fileTime) {
    console.log(fileTime.file);
  });
}

preaddir(dir).then(function (fileList) {
  function statFile (file) {
    return pstat(path.join(dir, file)).then(function (stat) {
      return { file: file, time: stat ? stat.mtime : 0 };
    });
  }
  q.all(fileList.map(statFile)).then(sortAndPrint);
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

<br>

#### What's the catch?

Error-handling as a second-class citizen

Heavy-weight abstraction: can easily mask problems

Viral: infect everything they touch

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

<br>

Magic to solve async programming pain?

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

<br>

Not actually magic

Not actually an async programming construct

A ***protocol*** with some additional syntactic sugar:

* `function* myGenerator () { /* ... */ }`
* `yield someValue;`

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

A pseudo random number generator (PRNG)

```js
// Linear congruential pseudo random number generator
function random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  for (var i = 0; i < 10; i++) {
    z = (a * z + c) % m;
    console.log(z);
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

A pseudo random number generator generator (PRNGG?)

```js
function* random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  while (true) {
    z = (a * z + c) % m;
    yield z;
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

```js
function* random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  while (true) {
    z = (a * z + c) % m;
    yield z;
  }
}
```

```js
var gen = random(100);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

```js
// PRNG in ES3 using the generator protocol
function random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  return {
    next: function () {
      z = (a * z + c) % m;
      return { value: z, done: false };
    }
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

```js
// PRNG generator with re-seed capabilities
function* random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  while (true) {
    z = (a * z + c) % m;
    seed = yield z; // if next() is called with a value, it returns here
    if (typeof seed == 'number')
      z = seed;
  }
}

var gen = random(10);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next(10).value); // re-seed
console.log(gen.next().value);
console.log(gen.next().value);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

For asynchronous programming?

```js
function timer (callback) {
  setTimeout(function () {
    callback(null, Date.now());
  }, Math.random() * 1000);
}

// take advantage of the suspendable nature of generators
function* timerGen () {
  var v1 = yield timer;
  console.log('v1', v1);
  var v2 = yield timer;
  console.log('v2', v2);
  var v3 = yield timer;
  console.log('v3', v3);
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

Requires a helper

```js
function runGenerator (fn) {
  var gen = fn();

  (function next (arg) {
    var it = gen.next(arg);
    if (it.done) return;

    it.value(function (err, data) {
      if (err) return gen.throw(err); // raise exception at `yield`
      next(data);
    });
  }());
}
```

<https://github.com/visionmedia/co>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

Callback-only functions make this practical

```js
function timer (timeout) {
  return function (callback) {
    setTimeout(function () { callback(null, Date.now()); }, timeout);
  }
}

runGenerator(function* timerGen () {
  var v1 = yield timer(1000);
  console.log('v1', v1);
  var v2 = yield timer(2000);
  console.log('v2', v2);
  var v3 = yield timer(3000);
  console.log('v3', v3);
});
```
<p style="font-size: 10px;"><a href="https://github.com/visionmedia/node-thunkify">https://github.com/visionmedia/node-thunkify</a></p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

<br>

#### What's the catch?

Not widely available

Not well optimised *yet*

Serial execution by default, parallel requires extra steps

Is it intuitive?

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous programming

<br>

<br>

<h4 style="text-align: center;">Accept it, it's the new norm</p>

