
# Stop Worrying and Learn to Love the Async

<p style="position: absolute; bottom: 0; font-size: 9px;">
  <i>This work is &copy; 2014 Rod Vagg and is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/au/">Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Australia License</a></i>
</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## @rvagg<br>Rod Vagg

<br>

<p style="text-align: center; padding-top: 5px;"><img src="img/erik.png" alt="Erik" style="width: 65px; border-radius: 5px; box-shadow: 0px 0px 7px rgba(0,0,0,0.4);"></p>

<p style="text-align: center; padding-top: 5px;"><img src="img/nodesource-hexagons.svg" alt="NodeSource" style="width: 75px; height: 75px; xborder-radius: 5px; xbox-shadow: 0px 0px 7px rgba(0,0,0,0.4);"></p>

<p style="text-align: center;">
  <a href="http://r.va.gg">http://r.va.gg</a><br>
  <a href="http://nodesource.com">http://nodesource.com</a>
</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# A Quick History of Computing

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## In the beginning

<br>

Programming was about *computing*

Computers were self-contained number-crunchers

<br>

_I/O was late to the game_

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is not *computing*

<br>

I/O is what computers wait for

I/O is the bottleneck in the majority of programs

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## But, I/O is usually hidden

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

# Then ...<br>User Interfaces

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The UI introduced new challenges

<br>

I/O in the form of a human

Unpredictable

*Very* high latency

Sequential programming has limits

Good UI's don't constrain the user

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Networked UI's: a perfect storm

<br>

User variability delivered over unreliable, high-latency networks

<br>

<i>Browsers...</i>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## On the web, nothing is synchronous

<br>

Always in *reactive* mode, responding to external events

 * React to user events
 * React to network events
 * React to browser events

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Enter JavaScript

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

## Asynchronicity at the extreme:<br>Node.js

<br>

Async works well for performing many complex, parallel tasks in the browser ...

<p style="text-align: center; font-style: italic; font-weight: bold;">Why not on the server too?</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Synchronous I/O with Node.js

<br>

Node.js can be _classic_

Synchronous file system I/O, on the JavaScript thread

```js
console.log('Reading data...');
var data = fs.readFileSync('in.dat');
console.log('Finished reading data!');
```

*Don't do this*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous I/O with Node.js

<br>

File system I/O is performed on a **thread-pool** when asynchronous

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

# The Callback

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

# Embrace the Async

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Embrace the Async

Node.js-style callbacks are a great way to represent an asynchronous platform

```js
fs.stat('fooballs.txt', function (err, stat) {
  if (err)
    // deal with it
  else
    // get on with it
})
```

* I/O is in your face, you have to deal with as a special case
* Error-handling is first-class
* The pattern is simple and allows highly compatible modularity

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Embrace the Async

<br>

Hide asynchronous behaviour at your peril

**Use abstractions wisely**: for productivity, not to change the fundamental nature of the platform

The world is asynchronous, programming should be asynchronous, learn to think in async

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous programming

<br>

<br>

<h4 style="text-align: center;">Accept it; it's the new norm</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## CampJS

<p style="text-align: center; padding-top: 5px;"><img src="img/campjs.png" alt="CampJS" style="width: 400px; border-radius: 5px; box-shadow: 0px 0px 7px rgba(0,0,0,0.4);"></p>

<p style="text-align: center; font-weight: bold;">Node.ninjas Discount, $85 off</p>

<p style="text-align: center; font-weight: bold;"><a href="https://ti.to/campjs/campjs-iv?release_id=iq4v0pooxfw">https://ti.to/campjs/campjs-iv?release_id=iq4v0pooxfw</a></p>