
# Node.js: Wut?

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Rod Vagg

<div style="margin: 5em; text-align: center;">

<img src="img/nodesource.png" style="width: 100px;">

<br><br>

<a href="https://twitter.com/rvagg">Twitter/@rvagg</a>

<br><br>

<a href="https://github.com/rvagg">GitHub/rvagg</a>

</div>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## What is Node.js?

<br>

A simple platform for writing
<br> &nbsp;&nbsp;&nbsp;&nbsp;&hellip; network-centric
<br> &nbsp;&nbsp;&nbsp;&nbsp;&hellip; JavaScript applications
<br> &nbsp;&nbsp;&nbsp;&nbsp;&hellip; using event-driven, non-blocking I/O

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The Essence of Node.js

<br>

* JavaScript on the server
* Asynchronous programming
* Module-driven development
* Small core, vibrant ecosystem

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<br><br>
<br><br>
<br><br>

## JavaScript on the Server

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## JavaScript on the Server

<br>

* Runtime: V8 _(Chrome)_
* Productive: C-family dynamic language
* Single-threaded _(A positive!)_
* Approachable, sans quirks
* “Developer joy”
* Massive pool of developers

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<img src="img/redmonk.png" style="margin: 2em auto; display: block; width: 450px;">

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Network-centric JavaScript

<br>

Node core:

 * &frac14; platform
 * &frac14; dev support
 * &frac14; abstractions, OS, libs & filesystem
 * **&frac14; networking**

_TCP, UDP, HTTP, HTTPS, TLS, URLs, query strings_

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<br><br>
<br><br>
<br><br>

## Asynchronous Programming

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronous Programming

Reactionary: callbacks, events, streams everywhere

JavaScript first-class functions: continuation-passing style

```js
// callbacks
fs.readFile('data.txt', 'utf8', function (err, data) {
  var lines = data.split('\n').length
  console.log(lines + ' lines')
})

// events
server.on('connection', function (stream) {
  console.log('someone connected!')
})
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is usually hidden

<style>
.smallnextjava + * pre {
  font-size: 11px;
}
</style>

<div class="smallnextjava"></div>

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

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Event-driven, non-blocking I/O

<br>

**Scalability**: kernel-level non-blocking socket I/O:<br><b><code>epoll</code></b> or <b><code>select</code></b>

**Concurrent**: worker threads for file I/O

JavaScript thread only needs to block for JavaScript!

*Unless you tell it otherwise*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Event-driven, non-blocking I/O

```js
// Synchronous (we avoid this)
console.log('Reading file...')
var data = fs.readFileSync('data.txt', 'utf8')
var lines = data.split('\n').length
console.log(lines + ' lines')
```

```js
// Asynchronous (we embrace this)
fs.readFile('data.txt', 'utf8', function (err, data) {
  var lines = data.split('\n').length
  console.log(lines + ' lines')
})
console.log('Reading file...')
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## libuv and the event loop

<table style="margin: 0 auto 20px auto;">
  <tr>
    <td colspan=3 style="border-bottom: dashed 2px rgb(134,136,118); padding: 1em; text-align: center;">
      **JavaScript callbacks**
    </td>
  </tr>
  <tr>
    <td style="text-align: center; padding: 0.5em;">Timers</td>
    <td style="text-align: center; padding: 0.5em;">
      <img src="img/eventloop2.gif" width="244" height="129" style="box-shadow: 0 0 20px rgba(0, 0, 0, 0.6); border-radius: 70px;">
    </td>
    <td style="text-align: center; padding: 0.5em;">Sleep?</td>
  </tr>
  <tr>
    <td style="text-align: center; padding: 0.5em;">Socket I/O</td>
    <td style="text-align: center; padding: 0.5em;">Filesystem I/O</td>
    <td style="text-align: center; padding: 0.5em;">OS events</td>
  </tr>
</table>

<p style="font-size: 8px;">GIF analogy credit: http://nodejsreactions.tumblr.com/post/56979518608/the-node-js-event-loop</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<br><br>
<br><br>
<br><br>

## Module-driven Development

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Module-driven Development

<br>

Module system solves most dependency-hell problems

The holy-grail of decoupled and reusable coding

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## npm - the Node Package Manager

<img src="img/npm.png" height="50" width="129" style="margin: 0 auto; display: block;">

Makes publishing and using packages a breeze

Minimises dependency and version conflicts

Ease and simplicity of reuse has encouraged a culture of ***extreme modularity***

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<img src="img/npm_growth.png" style="margin: 10px auto; display: block; height: 350px;">

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<img src="img/npm_growth_comparison.png" style="margin: 10px auto; display: block; width: 450px;">

<p style="font-size: 11px; margin-top: -10px; text-align: center;">Source <a href="http://modulecounts.com">modulecounts.com</a></p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Module-driven Development

Small chunks of code:

* Focused concerns
* Testable
* Grokkable
* Documentable
* Sharable
* Ease of collaboration

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


<style>
.smallnext + * pre {
  font-size: 6px;
}
</style>

<div class="smallnext"></div>

```js
module.exports = function archy (obj, prefix, opts) {
    if (prefix === undefined) prefix = '';
    if (!opts) opts = {};
    var chr = function (s) {
        var chars = {
            '│' : '|',
            '└' : '`',
            '├' : '+',
            '─' : '-',
            '┬' : '-'
        };
        return opts.unicode === false ? chars[s] : s;
    };
    
    if (typeof obj === 'string') obj = { label : obj };
    
    var nodes = obj.nodes || [];
    var lines = (obj.label || '').split('\n');
    var splitter = '\n' + prefix + (nodes.length ? chr('│') : ' ') + ' ';
    
    return prefix
        + lines.join(splitter) + '\n'
        + nodes.map(function (node, ix) {
            var last = ix === nodes.length - 1;
            var more = node.nodes && node.nodes.length;
            var prefix_ = prefix + (last ? ' ' : chr('│')) + ' ';
            
            return prefix
                + (last ? chr('└') : chr('├')) + chr('─')
                + (more ? chr('┬') : chr('─')) + ' '
                + archy(node, prefix_, opts).slice(prefix.length + 2)
            ;
        }).join('')
    ;
};
```

<p style="font-size: 11px; margin-top: -10px; text-align: center;"><a href="https://github.com/substack/node-archy">https://github.com/substack/node-archy</a> <i>(download rank: 174)</i></p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<br><br>
<br><br>
<br><br>

## Small Core, Vibrant Ecosystem

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Small Core, Vibrant Ecosystem

<br>

Node's core contains mostly essentials

Constant debate about what gets in

<br>

_"The standard library is where modules go to die."_

&nbsp; &nbsp; &nbsp; —Kenneth Reitz

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<table cellpadding=0 cellspacing=0 style="border-collapse: collapse; margin: 20px auto;">
  <tr>
    <td style="border-bottom: dashed 2px rgb(134,136,118); padding: 2em; text-align: center;">JavaScript</td>
    <td style="border: solid 2px rgb(134,136,118); background-color: rgb(245,245,244); padding: 2em; text-align: center;" colspan=4>Node core library</td>
    <td style="border-bottom: dashed 2px rgb(134,136,118); padding: 0.5em;">&nbsp;</td>
  </tr>
  <tr>
    <td style="padding: 2em; text-align: center;" rowspan=2>C / C++</td>
    <td style="border: solid 2px rgb(134,136,118); padding: 2em; text-align: center;" colspan=4>Node bindings</td>
  </tr>
  <tr>
    <td style="border: solid 2px rgb(134,136,118); padding: 1em; text-align: center;">
      **V8**
    </td>
    <td style="border: solid 2px rgb(134,136,118); padding: 1em; text-align: center;">
      **libuv**
    </td>
    <td style="border: solid 2px rgb(134,136,118); padding: 1em; text-align: center;">
      *OpenSSL<br>zlib<br>http_parser<br>cares*
    </td>
  </tr>
</table>

<p style="font-size: 8px;">Original version of this table by Bert Belder: http://www.youtube.com/watch?v=nGn60vDSxQ4</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Small Core, Vibrant Ecosystem

<br>

npm & Node's modularity enables a vibrant ecosystem

Experimentation pushed to the edges

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Small Core, Vibrant Ecosystem

Experimentation!

* Build tools: Grunt, Gulp, etc.
* Browser tools: Browserify, WebPack
* Level*
* StackGL, etc.
* Desktop application tooling: NW.js, Atom _(Electron)_
* IoT & robotics
* Languages & language features

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Rod Vagg

<div style="margin: 5em; text-align: center;">

<img src="img/nodesource.png" style="width: 100px;">

<br><br>

<a href="https://twitter.com/rvagg">Twitter/@rvagg</a>

<br><br>

<a href="https://github.com/rvagg">GitHub/rvagg</a>

</div>