```json
{
    "date"   : "2014-06-14"
  , "title"  : "Why I don't use Node's core 'stream' module"
  , "author" : "Rod Vagg"
}
```

*This article was originally offered to nearForm for publishing and appeared for some time on their blog from early 2014 (at this URL: http://www.nearform.com/nodecrunch/dont-use-nodes-core-stream-module). It has since been deleted. I'd rather not speculate about the reasons for the deletion but I believe the article contains a very important core message so I'm now republishing it here.*


## TL;DR

The "readable-stream" package available in npm is a mirror of the Streams2 and Streams3 implementations in Node-core. You can guarantee a stable streams base, regardless of what version of Node you are using, if you only use "readable-stream".

## The good 'ol days

Prior to Node 0.10, implementing a stream meant extending the core `Stream` object. This object was simply an `EventEmitter` that added a special `pipe()` method to do the streaming magic.

Implementing a stream usually started with something like this:

```js
var Stream = require('stream').Stream
var util = require('util')

function MyStream () {
  Stream.call(this)
}

util.inherits(MyStream, Stream)

// stream logic, implemented however you want
```

If you ever had to write a non-trivial stream implementation for pre-Node 0.10 without using a helper library (such as [through](https://github.com/dominictarr/through)), you know what a nightmare the state-management it can be. The actual implementation of a custom stream is a lot more than just the above code.

## Welcome to Node 0.10

Thankfully, Streams2 came along with a brand new set of base Stream implementations that do a whole lot more than `pipe()`. The biggest win for stream implementers comes from the fact that state-management is almost entirely taken care of for you. You simply need to provide concrete implementations of some abstract methods to make a fully functional stream, even for non-trivial workloads.

Implementing a stream now looks something like this:

```js
var Readable = require('stream').Readable
// `Stream` is still provided for backward-compatibility
// Use `Writable`, `Duplex` and `Transform` where required
var util = require('util')

function MyStream () {
  Readable.call(this, { /* options, maybe `objectMode:true` */ })
}

util.inherits(MyStream, Readable)

// stream logic, implemented mainly by providing concrete method implementations:

MyStream.prototype._read = function (size) {
  // ... 
}
```

State-management is handled by the base-object and you interact with internal methods, such as `this.push(chunk)` in the case of a `Readable` stream.

While the internal streams implementations are an order-of-magnitude more complex than the previous core-streams implementation, most of it is there to make life an order-of-magnitude easier for those of us implementing custom streams. Yay!

## Backward-compatibility

When every new major stable release of Node occurs, anyone releasing public packages in npm has to make a decision about which versions of Node they support. As a general rule, the authors of the most popular packages in npm will support the current stable version of Node and the previous stable release.

Streams2 was designed with backwards-compatibility in mind. Streams using `require('stream').Stream` as a base will still mostly work as you'd expect and they will also work when piped to streams that extend the other classes. Streams2 streams won't work like classic EventEmitter objects when you pipe them together, as old-style streams do. But when you pipe a Streams2 stream and an old-style EventEmitter-based stream together, Streams2 will fall-back to "compatibility-mode" and operate in a backward-compatible way.

So Streams2 are great and mostly backward-compatible (aside from some tricky edge cases). But what about when you want to implement Streams2 and run on Node 0.8? And what about open source packages in npm that want to still offer Node 0.8 compatibility while embracing the new Streams2-goodness?

### "readable-stream" to the rescue

During the 0.9 development phase, prior to the 0.10 release, Isaac developed the new Streams2 implementation in a package that was released in npm and usable on older versions of Node. The [readable-stream](https://github.com/isaacs/readable-stream) package is essentially a mirror of the streams implementation of Node-core but is available in npm. This is a pattern we will hopefully be seeing more of as we march towards Node 1.0. Already there is a [core-util-is](https://github.com/isaacs/core-util-is) package that makes available the shiny new `is` type-checking functions in the 0.11 core 'util' package.

**readable-stream** gives us the ability to use Streams2 on versions of Node that don't even have Streams2 in core. So a common pattern for supporting older versions of Node while still being able to hop on the Streams2-bandwagon starts off something like this, assuming you have "readable-stream" as a dependency:

```js
var Readable = require('stream').Readable || require('readable-stream').Readable
```

This works because there is no `Readable` object on the core 'stream' package in 0.8 and prior, so if you are running on an older version of Node it skips straight to the "readable-stream" package to get the required implementation.

## Streams3: a new flavour

The **readable-stream** package is still being used to track the changes to streams coming in 0.12. The upcoming Streams3 implementation is more of a tweak than a major change. It contains an attempt to make "compatibility mode" more of a first-class citizen of the API and also some improvements to pause/resume behaviour.

Like Streams2, the aim with Streams3 is for backward (and forward) compatibility but there are limits to what can be achieved on this front.

While this new streams implementation will likely be an improvement over the current Streams2 implementation, it is part of the *unstable* development branch of Node and is so far not 
without its edge cases which can break code designed against the pure 0.10 versions of Streams2.

## What is your base implementation?

Looking back at the code used to fetch the base Streams2 implementation for building custom streams, let's consider what we're actually getting with different versions of Node:

```js
var Readable = require('stream').Readable || require('readable-stream').Readable
```

* *Node 0.8 and prior:* we get whatever is provided by the readable-stream package in our dependencies.
* *Node 0.10:* we get the particular version of Streams2 that comes with the version of Node we're using.
* *Node 0.11:* we get the particular version of Streams3 that comes with the version of Node we're using.

This may not be interesting if you have full control over all deployments of your custom stream implementations and which version(s) of Node they will be used on. But it can cause some problems in the case of open source libraries distributed via npm with users still stuck on 0.8 (for some, the upgrade path is not an easy one for various reasons), 0.10 and even people trying out some of the new Node and V8 features available in 0.11.

What you end up with is a very unstable base upon which to build your streams implementation. This is particularly acute since the vast bulk of the code used to construct the stream logic is coming from either Node-core or the readable-stream package. Any *bugs* fixed in later Node 0.10 releases will obviously still be present for people still stuck on earlier 0.10 releases even if the readable-stream dependency has the *fixed* version.

Then, when your streams code is run on Node 0.11, suddenly it's a Streams3 stream which has slightly different behaviour to what most of your users are experiencing.

One of the ways these subtle differences are exposed is in bug reports. Users may report a bug that only occurs on their particular combination of core-streams and readable-stream and it may not be obvious that the problem is related to base-stream implementation edge-cases they are stumbling upon; wasting time for everyone.

And what about stability? The fragmentation introduced by all of the possible combinations means that your otherwise stable library is having instability foisted upon it from the outside. This is one of the costs of relying on a featureful standard-library (core) within a rapidly developing, pre-v1 platform. But we can do something about it by taking control of the exact version of the base streams objects we want to extend regardless of what is bundled in the version of Node being used. **readable-stream** to the rescue!

## Taking control

To control exactly what code your streams implementation is building on, simply pin the version of readable-stream and use only it, avoiding `require('stream')` completely. Then you get to make the choice when to upgrade to Streams3, even if that's some time *after* Node 0.12.

**readable-stream** comes in two major versions, **v1.0.x** and **v1.1.x**. The former tracks the Streams2 implementation in Node 0.10, including bug-fixes and minor improvements as they are added. The latter tracks Streams3 as it develops in Node 0.11; we may see a v1.2.x branch for Node 0.12.

Any library worth using should be following the basics of semver minor and patch versions (the merits and finer points of major versioning are still something worth debating). readable-stream gives you proper patch-level versioning so if you pin to `"~1.0.0"` you'll get the latest Node 0.10 Streams2 implementation, including any fixes and minor non-breaking improvements. The patch-level version of 1.0.x and 1.1.x should mirror the patch-level versions of Node core releases as we proceed.

When you're ready to start using Streams3 you can pin to `"~1.1.0"`, but you should hold off until much closer to Node 0.12, if not after its formal release.

## Small core FTW!

Being able to control precisely the versions of dependencies your code uses reduces the scope for bugs introduced by version incompatibilities or new and unproven implementations.

When we rely on a bulky standard-library to build our libraries and applications, we're relying on a shifting sand that we have little control over. This is particularly a problem for open source libraries whose users have legitimate (and sometimes not-so-legitimate) reasons for using versions that you'd rather not have to support.

Streams2 is a powerful abstraction, but the implementation is far from simple. The Streams2 code is some of the most complex JavaScript you'll find in Node core. Unless you want to have a detailed understanding of how they work and be able to track the changes as they develop, you should pin your Streams2 dependency in the same way as you pin all your other dependencies. Opt for **readable-stream** over what Node-core offers:

```json
{
  "name": "mystream",
  ...
  "dependencies": {
    "readable-stream": "~1.0.0"
  }
}
```

```js
var Readable = require('readable-stream').Readable
var util = require('util')

function MyStream () {
  Readable.call(this)
}

util.inherits(MyStream, Readable)

MyStream.prototype._read = function (size) {
  // ... 
}
```

## Addendum: "through2"

If the boilerplate of the Streams2 base objects ("classes") is too much for you or triggers some past-life Java PTSD, you can just opt for the "through2" package in npm to get the job done.

[through2](https://github.com/rvagg/through2) is based on Dominic Tarr's [through](https://github.com/dominictarr/through) but is built for Streams2, whereas "through" is a pure Streams1 style. The API isn't quite the same but the flexibility and simplicity is.

through2 gives you a `DuplexStream` as a base to implement any kind of stream you like, be it as purely readable, purely writable or a fully duplex stream. In fact, you can even use through2 to implement a `PassThrough` stream by not providing an implementation!

From the examples:

```js
var through2 = require('through2')

fs.createReadStream('ex.txt')
  .pipe(through2(function (chunk, enc, callback) {

    for (var i = 0; i < chunk.length; i++)
      if (chunk[i] == 97)
        chunk[i] = 122 // swap 'a' for 'z'

    this.push(chunk)

    callback()

   }))
  .pipe(fs.createWriteStream('out.txt'))
```

Or an object stream:

```js
fs.createReadStream('data.csv')
  .pipe(csv2())
  .pipe(through2.obj(function (chunk, enc, callback) {

    var data = {
        name    : chunk[0]
      , address : chunk[3]
      , phone   : chunk[10]
    }

    this.push(data)

    callback()

  }))
  .on('data', function (data) {
    all.push(data)
  })
  .on('end', function () {
    doSomethingSpecial(all)
  })
```
