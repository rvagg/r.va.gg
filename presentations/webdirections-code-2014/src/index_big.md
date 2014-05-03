
# Asynchronous JavaScript Patterns

<p style="position: absolute; bottom: 0; font-size: 9px;">
  <i>This work is &copy; 2014 Rod Vagg and is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/au/">Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Australia License</a></i>
</p>

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

Constructing basic abstractions: series, each, map, memoisation

Advanced abstractions

* EventEmitter
* Streams
* Promises
* Continuables / thunks

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

## The CPU wants to be busy

<br>

An idle CPU is a waste of a valuable resource

Solutions?

 * Multi-process
 * Threads
 * Non-blocking I/O

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The UI introduced new challenges

<br>

I/O in the form of a human

Unpredictable

*Very* high latency

Sequential programming has limits

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Sequential programming for UIs?

```sh
#!/bin/sh

echo -n "What's your name? "
read name
runcmd() {
  echo -n "OK ${name}, what command shal I run? "
  read cmd
  echo "Here's the output of the command \`${cmd}\`, ${name}:\n"
  $cmd
  echo -n "\nMore commands ${name}? [Y/n] "
  read more
  if [ "$more" != "n" ]; then
    runcmd
  fi
}
runcmd
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Good UIs don't constrain the user

<br>

Wide range of:

* input devices

* user preferences

* user abilities

* users!

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

* Function scope for simple closures

* *Single-threaded*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronicity at the extreme: Node.js

<br>

Async works well for performing many complex, parallel tasks in the browser, why not on the server too?

**Async all the things!**

All I/O is asynchronous, some optional synchronous calls

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Synchronous I/O with Node.js

**Synchronous** file system I/O, on the JavaScript thread

```js
console.log('Reading data...');
var data = fs.readFileSync('in.dat');
console.log('Finished reading data!');
```

*Don't do this*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous I/O with Node.js

File system I/O is performed on a thread-pool when asynchronous

**Asynchronous** file system I/O, off the JavaScript thread

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

*Example usage with proper async:*

```js
asyncMap(
  [ 1, 2, 3 ],
  function (el, callback) {
    setTimeout(function () {
      callback(null, el * 10);
    }, Math.random() * 1000);
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
  };
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
// v2: extract individual file processor
function catFile (file, callback) {
  fs.readFile(file, 'utf8', function (err, contents) {
    if (err) return callback(err);

    fs.appendFile(output, contents, callback);
  });
}

files.forEach(function (file) {
  catFile(file, function (err) {
    if (err) throw err;
  });
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v3: process files one at a time
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

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v4: alternative, less obvious, execution
function catFile (file, callback) {
  fs.readFile(file, 'utf8', function (err, contents) {
    if (err) return callback(err);
    fs.appendFile(output, contents, callback);
  });
}

(function next (index) {
  if (index >= files.length)
    return console.log('Done!');
  catFile(files[index], function (err) {
    if (err) throw err;
    next(index + 1);
  });
}(0));
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// a serial async executor
function serial (fns, callback) {
  var index = 0;
  function next (index) {
    if (index >= fns.length)
      return callback();
    fns[index](function (err) {
      if (err) return callback(err);
      next(index + 1);
    });
  }
  next(0);
}
```

<https://github.com/hughsk/async-series>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v5: use the serial() abstraction
serial([
    function (callback) { catFile(files[0], callback); },
    function (callback) { catFile(files[1], callback); },
    function (callback) { catFile(files[2], callback); },
    function (callback) { catFile(files[3], callback); }
  ],
  function (err) {
    if (err) throw err;
    console.log('Done!');  
  }
);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: serial execution

```js
// v6: make flexible
function mkCatFile (file) {
  return function (callback) {
    catFile(file, callback);
  }
}

var fns = files.map(mkCatFile);

serial(fns, function (err) {
  if (err) throw err;
  console.log('Done!');  
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

Exercise: write a templating engine

Tools:

```js
// uber-simple template replacer
// replaces entries like: {foo}
// given an object like `{ foo: 'bar!' }`

function replace (template, model) {
  var re;
  for (var key in model) {
    re = new RegExp('{' + key + '}', 'g');
    template = template.replace(re, model[key]);
  }
  return template;
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

```js
// v1: basic structure, needs template logic
function processTemplate (file, model, callback) {
  /* .. template stuff .. */
  callback(null, renderedTemplateString);
}

var model = { name: 'Rod', status: 'w00t!' };

processTemplate('demo.tmpl', model, function (err, content) {
  if (err) throw err;
  console.log('Rendered content:\n', content);
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

```js
// v2: working implementation
function processTemplate (file, model, callback) {
  fs.readFile(file, 'utf8', function (err, content) {
    if (err) return callback(err);
    content = replace(content, model);
    callback(null, content);
  })
}

var model = { name: 'Rod', status: 'w00t!' };

processTemplate('demo.tmpl', model, function (err, content) {
  if (err) throw err;
  console.log('Rendered content:\n', content);
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

```js
// v3: cache file contents
var cache = {};
function processTemplate (file, model, callback) {
  if (cache[file]) {
    return setImmediate(function () {
      callback(null, cache[file]);
    })
  }

  fs.readFile(file, 'utf8', function (err, content) {
    if (err) return callback(err);
    cache[file] = content;
    content = replace(content, model);
    callback(null, content);
  })
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

```js
// v4: ensure single read per-file
var cache = {}, pending = {};
function processTemplate (file, model, callback) {
  if (cache[file])
    return setImmediate(function () { callback(null, cache[file]); })
  if (!pending[file]) {
    pending[file] = [];
    fs.readFile(file, 'utf8', function (err, content) {
      if (!err) cache[file] = content;
      pending[file].forEach(function (p) {
        if (err) return p.callback(err);
        p.callback(null, replace(content, p.model));
      });
      delete pending[file];
    });
  }
  pending[file].push({ model: model, callback: callback });
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

<p class="shrink"></p>

```js
// a memoisation utility, first arg of `wrappedFn` is `key`, last arg is `callback`
function memoise (wrappedFn) {
  var cache = {}, pending = {};
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var key = args[0], callback = args.pop(); // remove original callback
    if (cache[key])
      return setImmediate(function () { callback.apply(null, cache[key]) });
    if (!pending[key]) {
      pending[key] = [];
      function cb () {
        cache[key] = Array.prototype.slice.call(arguments);
        pending[key].forEach(function (p) { p.callback.apply(null, cache[key]); });
        delete pending[key];
      }
      wrappedFn.apply(null, args.concat([ cb ]));
    }
    pending[key].push({ callback: callback, args: args });
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Basic abstractions: memoisation

```js
// v5: use the `memoise()` utility
var memoisedReadFile = memoise(fs.readFile);

function processTemplate (file, model, callback) {
  memoisedReadFile(file, 'utf8', function (err, content) {
    if (err) return callback(err);
    content = replace(content, model);
    callback(null, content);
  })
}

var model = { name: 'Rod', status: 'w00t!' };

processTemplate('demo.tmpl', model, function (err, content) {
  if (err) throw err;
  console.log('Rendered content:\n', content);
});
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions

<br>

* EventEmitter

* Streams

* Promises

* Continuables / thunks

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

Useful for communicating state and unrelated events

```js
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

## Advanced abstractions: EventEmitter

In Node.js, APIs taking a simple callback should fire that callback **once** or never

```js
// a Node.js anti-pattern:

http.createServer(function (req, res) {
  res.end('Hello World!');
}).listen(8888);

// better:

var server = http.createServer();
server.on('request', function (req, res) {
  res.end('Hello World!');
});
server.listen(8888);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

Useful if you want a concrete object to identify an async call

```js
function getFromDatabase (key) {
  var ee = new EventEmitter();
  setImmediate(processGet);
  return ee;  

  function processGet () {
    db.get(key, function (err, value) {
      if (err) return ee.emit('error', err);
      ee.emit('data', value);
    });
  }
}

var get = getFromDatabase('foo');
get.on('data', console.log);
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

<p class="shrink"></p>

```js
// for detailed feedback about async progress
function getFromDatabase (key) {
  var ee = new EventEmitter();
  var connection;
  setImmediate(processGet);
  return ee;

  function processGet () {
    pool.getConnection(function (err, connection, isNew) {
      if (err) return ee.emit('error', err);
      ee.emit(isNew ? 'newConnection' : 'existingConnection');
      ee.emit('fetching', key);
      connection.get(key, function (err, value) {
        if (err) return ee.emit('error', err);
        ee.emit('data', value);
      });
    });
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: EventEmitter

For observability

```js
var EventEmitter = require('event').EventEmitter;
var inherits = require('util').inherits;

function Database () {
  EventEmitter.call(this);
}

inherits(Database, EventEmitter);

Database.prototype.get = function (key, callback) {
  this.emit('get', key);
  // ... perform get, call `callback`
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Streams

#### For

* Chunked data processing
* Chunked I/O

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

## Advanced abstractions: Streams

Dust.js: streaming template rendering *(an interesting use-case)*

<p class="shrink"></p>

```html
<h1>{title}</h1>
<ul>
{#names}
  <li><a href="{url}">{name}</a></li>{~n}
{/names}
</ul>
```

<p class="shrink"></p>

```js
function body_0(chk,ctx){
  return chk.write("<h1>").reference(ctx.get("title"),ctx,"h").write("</h1><ul>")
    .section(ctx.get("names"),ctx,{"block":body_1},null).write("</ul>");
}
function body_1(chk,ctx){
  return chk.write("<li><a href=\"").reference(ctx.get("url"),ctx,"h").write("\">")
    .reference(ctx.get("name"),ctx,"h").write("</a></li>\n");
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

An abstraction with a very well-defined API

Promises/A+ <http://promisesaplus.com/>

Simple definition: **A concrete object with a `then()` method as a hook in to the state and data represented by the *Promise***

Three states: **pending, fulfilled, rejected**

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

<!--

## Advanced abstractions: Promises

<p style="text-align: center; padding-top: 5px;"><img src="img/q_doom.png" alt="DOOM" style="width: 400px; box-shadow: 0px 0px 18px rgba(0,0,0,0.3);"></p>

<p st\yle="font-size: 10px; font-style: italic;">ORLY? <i>From <a href="https://github.com/kriskowal/q">https://github.com/kriskowal/q</a></i></p>

-->

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Advanced abstractions: Promises

<br>

#### What's the catch?

Error-handling as a second-class citizen

* Programmer errors difficult to detect
* Very easy to ignore error handling

Heavy-weight abstraction: can easily mask problems

Viral: infect everything they touch

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<h2 style="font-size: 24px;">Advanced abstractions: continuables / thunks</h2>

<br>

**A function that take a single callback argument**

Like light-weight Promises

Concrete objects representing units of work

Easily defined

Composable

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<h2 style="font-size: 24px;">Advanced abstractions: continuables / thunks</h2>

```js
var readFile = function (uri) {
  return function (callback) { fs.readFile(uri, callback); }
}
```

<p style="font-size: 14px;"><a href="https://github.com/Raynos/continuable">https://github.com/Raynos/continuable</a></p>

```js
var readFile = continuable.to(fs.readFile);
var readindat = readFile('in.dat', 'utf8');
readindat(function (err, contents) { /* ... */ });
```

<p style="font-size: 14px;"><a href="https://github.com/visionmedia/node-thunkify">https://github.com/visionmedia/node-thunkify</a></p>

```js
var readFile = thunkify(fs.readFile);
var readindat = readFile('in.dat', 'utf8');
readindat(function (err, contents) { /* ... */ });
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<h2 style="font-size: 24px;">Advanced abstractions: continuables / thunks</h2>

#### Why?

Simpler and more flexible abstractions

```js
para([ cont1, cont2, cont3 ])(function (err, arr) {
  // arr == [ .., .., .. ]
});

para(cont1, cont2, cont3)(function (err, ary) {
  // arr == [ .., .., .. ]
});

para({ A: cont1, B: cont2, C: cont3 })(function (err, obj) {
  // obj == { A:.., B:..., C:... }
});
```

<https://github.com/dominictarr/continuable-para>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<h2 style="font-size: 24px;">Advanced abstractions: continuables / thunks</h2>

<br>

#### What's the catch?

Higher-order programming...

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

Generators are a protocol for functions that can return multiple values

* Returns an object that has a `next()` function
* Executed when `next()` is called
* Execution is halted when `yield` is called
* `yield` causes an object with `'value'` and `'done'` properties to be returned
* If `'done'` is `false`, `'value'` has a value
* Execution is continued when `next()` is called
* A `return` (or function end) causes the return object to have `'done'` equal `true` and `'value'` to have the return value

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

```js
// re-seedable PRNG in ES3 using the generator protocol
function random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  return {
    next: function (seed) {
      z = typeof seed == 'number' ? seed : (a * z + c) % m;
      return { value: z, done: false };
    }
  }
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

Generators also have a `throw()` method

```js
function* random (seed) {
  var m = 25, a = 11, c = 17, z = seed;
  while (true) {
    z = (a * z + c) % m;
    try {
      seed = yield z; // throw() throws the Error object here
    } catch (e) {
      console.error('Whoa!!', e.message);
      break;
    }
    if (typeof seed == 'number')
      z = seed;
  }
  return -1; // optional, will show up as `value`
}
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
      if (err) return gen.throw(err);
      next(data);
    });
  }());
}
```

<https://github.com/visionmedia/co>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ES6 Generators

Continuables / thunks make this practical

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

