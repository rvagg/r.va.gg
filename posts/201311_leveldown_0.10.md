```json
{
    "date"   : "2013-11-18"
  , "title"  : "LevelDOWN v0.10 / managing GC in native V8 programming"
  , "author" : "Rod Vagg"
}
```

![LevelDB](https://twimg0-a.akamaihd.net/profile_images/3360574989/92fc472928b444980408147e5e5db2fa_bigger.png)

Today we released version 0.10 of [LevelDOWN](https://github.com/rvagg/node-leveldown). LevelDOWN is the package that directly binds LevelDB into Node-land. It's mainly C++ and is a fairly raw & direct interface to LevelDB. [LevelUP](https://github.com/rvagg/node-levelup) is the package that we recommend most people use for LevelDB in Node as it takes LevelDOWN and makes it much more Node-friendly, including the addition of those lovely *ReadStreams*.

Normally I wouldn't write a post about a minor release like this but this one seems significant because of a number of small changes that culminate in a *relatively* major release.

***In this post:***

 * **V8 `Persistent` references**
 * **`Persistent` in LevelDOWN; some removed, some added**
 * **Leaks!**
 * **Snappy 1.1.1**
 * **Some embarrassing bugs**
 * **Domains**
 * **Summary**
 * ***A final note on Node 0.11.9***

### V8 `Persistent` references

The main story of this release are `v8::Persistent` references. For the uninitiated, V8 internally has two different ways to track "handles", which are references to JavaScript objects and values currently active in a running program. There are `Local` references and there are `Persistent` references. `Local` references are the most common, they are the references you get when you create an object or pass them around within a function and do the normal work that you do with an object. `Persistent` references are a special case that is all about *Garbage Collection*. An object that has at least one active `Persistent` reference to it is not a candidate for garbage collection. `Persistent` references must be explicitly destroyed before they release the object and make it available to the garbage collector.

Prior to V8 3.2x.xx *(I don't know the exact version, does it matter? It roughly corresponds to Node v0.11.3.)*, these handles were both as easy as each other to create and interchange. You could swap one for the other whenever you needed. My guess is that the V8 team decided that this was a little *too* easy and that a major cause for memory leaks in C++ V8 code was the ease at which you could swap a `Local` for a `Persistent` and then forget to destroy the `Persistent`. So they tweaked the "ease" equation and it's become quite difficult.

`Persistent` and `Local` no longer share the same type hierarchy and the way you instantiate and assign a `Persistent` has become quite awkward. You now have to go through enough gymnastics to create a `Persistent` that it makes you ask the question: *"Do I really need this to be a `Persistent`?"* Which I guess is a good thing for memory leaks. [NAN](https://github.com/rvagg/nan) to the rescue though! We've somewhat papered over those difficulties with the capabilities introduced in NAN, it's still not as easy as it once was but it's not a total headache.

So, you understand `v8::Persistent` now? Great, so back to LevelDOWN.

### `Persistent` in LevelDOWN; some removed, some added!

**Some removed**

Recently, [Matteo](https://github.com/mcollina) noticed that when you're performing a `Batch()` operation in LevelDB, there is an explicit copy of the data that you're feeding in to that batch. When you construct a Batch operation in LevelDB you start off with a short string representing the batch and then build on that string as you build your batch with both `Put()` and `Del()` operations. You end up with a long string containing all of your write data; keys and values. Then when you call `Write()` on the Batch, that string gets fed directly into the main LevelDB store as a single write&mdash;which is where the atomicity of Batch comes from.

Both the chained-form and array-form `batch()` operations work this way internally in LevelDOWN.

However, with almost all operations in LevelDOWN, we perform the actual writes and reads against LevelDB in libuv worker threads. So we have to create the "descriptor" for work in the main V8 Node thread and then hand that off to libuv to perform the work in a separate thread. Once the work is completed we get the results back in the main V8 Node thread from where we can trigger a callback. This is where `Persistent` references come in.

Before we hand off the work to libuv, we need to make `Persistent` references to any V8 object that we want to survive across the asynchronous operation. Obviously the main candidate for this is `callback` functions. Consider this code:

```js
db.get('foo', function (err, value) {
  console.log('foo = %s', value)
})
```

What we've actually done is create an anonymous closure for our callback. It has nothing referencing it, so as far as V8 is concerned it's a candidate for garbage collection once the current thread of execution is completed. In Node however, we're doing asynchronous work with it and need it to survive until we actually call it. This is where `Persistent` references come in. We receive the `callback` function as a `Local` in our C++ but then assign it to a `Persistent` so GC doesn't touch it. Once we're done our async work we can call the function and destroy the `Persistent`, effectively turning it back in to a `Local` and freeing it up for GC.

Without the `Persistent` then the behaviour is indeterminate. It depends on the version of V8, the GC settings, the workload currently in the program and the amount of time the async work takes to complete. If the GC is aggressive enough and has a chance to run before our async work is complete, the `callback` will disappear and we'll end up trying to call a function that no longer exists. This can obviously lead to runtime errors and will most likely crash our program.

In LevelDOWN, if you're passing in `String` objects for keys and values then to pull out the data and turn it in to a form that LevelDB can use we have to do an explicit *copy*. Once we've copied the data from the `String` then we don't need to care about the original object and GC can get its hands on it as soon as it wants. So we can leave `String` objects as `Local` references while we are building the descriptor for our async work.

`Buffer` objects are a different matter all together. Because we have access to the raw character array of a `Buffer`, we can feed that data straight in to LevelDB and this will save us one *copy* operation (which can be a significant performance boost if the data is significantly large or you're doing lots of operations&mdash;so prefer `Buffer`s where convenient if you need higher perf). When building the descriptor for the async work, we are just passing a character array to the LevelDB data structures that we're setting up. Because the data is shared with the original `Buffer` we have to make sure that GC doesn't clean up that `Buffer` before we have a chance to use the data. So we make a `Persistent` reference for it which we clean up after the async work is complete. So you can do this without worrying about GC:

```js
db.put(
    new Buffer('foo')
  , require('crypto').randomBytes(1024)
  , function (err) {
      console.log('foo is now some random data!')
    }
)
```

This has been the case in LevelDOWN for all operations since pretty much the beginning. But back to Matteo's observation. If LevelDB's data structures perform an explicit copy on the data we feed it then perhaps we don't need to keep the original data safe from GC? For a `batch()` call it turns out that we don't! When we're constructing the Batch descriptor, as we feed in data to it, both `Put()` and `Del()`, it's taking a copy of our data to create its internal representation. So even when we're using `Buffer` objects on the JavaScript side, we're done with them before the call down in to LevelDOWN is completed so there's no reason to save a `Persistent` reference! For other operations we're still doing some copying during the asynchronous cycle but the removal of the overhead of creating and deleting `Persistent` references for `batch()` calls is fantastic news for those doing bulk data loading (like Max Ogden's [dat](https://github.com/maxogden/dat) project which needs to bulk load a *lot* of data).

**Some added**

Another gem from Matteo was reports of crashes during certain `batch()` operations. Difficult to reproduce and only under very particular circumstances, it seems to be mostly reproducible by the kinds of workloads generated by LevelGraph. Thanks to some simple C++ debugging we traced it to a dropped reference, obviously by GC. The code in question boiled down to something like this:

```js
function doStuff () {
  var batch = db.batch()
  batch.put('foo', 'bar')
  batch.write(function (err) {
    console.log('done', err)
  })
}
```

In this code, the `batch` object is actually a LevelDOWN `Batch` object created in C++-land. During the `write()` operation, which is asynchronous, we end up with no hard references to `batch` in our code because the JS thread has yieled and moved on and the `batch` is contained within the scope of the `doStuff()` function. Because most of the asynchronous operations we perform are relatively quick, this normally doesn't matter. But for writes to LevelDB, if you have enough data in your write and you have enough data already in your data store, you can trigger a compaction upstream which can delay the write which can give V8's GC time to clean up references that might be important and for which you have no `Persistent` handles.

In this case, we weren't actually creating internal `Persistent` references for some of our objects. `Batch` in this case but also `Iterator`. Normally this isn't a problem because to use these objects you *generally* keep references to them yourself in your own code.

We managed to debug Matteo's crash by adjusting his test code to look something like this and watching it succeed without a crash:

```js
function doStuff () {
  var batch = db.batch()
  batch.put('foo', 'bar')
  batch.write(function (err) {
    console.log('done', err)
    batch.foo = 'bar'
  })
}
```

By reusing `batch` inside our `callback` function, we're creating some work that V8 can't optimise away and therefore has to assume isn't a noop. Because the `batch` variable is also now referenced by the `callback` function and we already have an internal `Persistent` for it, GC has to pass over `batch` until the `Persistent` is destroyed for the `callback`.

So the solution is simply to create a `Persistent` for the internal objects that need to survive across asynchronous operations and make no assumptions about how they'll be used in JavaScript-land. In our case we've gone for assigning a `Persistent` just prior to every asynchronous operation and destroying it after. The alternative would be to have a `Persistent` assigned upon the creation of objects we care about but sometimes we want GC to do its work:

```js
function dontDoStuff () {
  var batch = db.batch()
  batch.put('foo', 'bar')
  // nothing else, wut?
}
```

I don't know why you would write that code but perhaps you have a use-case where you want the ability to start constructing a batch but then decide not to follow through with it. GC should be able to take care of your mess like it does with all of the other messes you create in your daily adventures with JavaScript.

So we are only assigning a `Persistent` when you do a `write()` with a chained-batch operation in LevelDOWN since it's the only asynchronous operation. So in `dontDoStuff()` GC will come along and rid us of `batch`, `'foo'` and `'bar'` when it has the next opportunity and our C++ code will have the appropriate destructors called that will clean up any other objects we have created along the way, like the internal LevelDB `Batch` with its copy of our data.

### Leaks!

We've been having some trouble with leaks in LevelUP/LevelDOWN lately *([LevelDOWN/#171](https://github.com/rvagg/node-levelup/issues/171), [LevelGraph/#40](https://github.com/mcollina/levelgraph/issues/40))*. And it turns out that these leaks aren't related to `Persistent` references, which shouldn't be a surprise since it's so easy to leak with non-GC code, particularly if you spend most of your day programming in a language with GC.

With the help of [Valgrind](http://valgrind.org/) we tracked the leak down to the omission of a `delete` in the destructor of the asynchronous work descriptor for array-batch operations. The internal LevelDB representation of a Batch wasn't being cleaned up unless you were using the chained-form of LevelDOWN's `batch()`. This one has been dogging us for a few releases now and it's been a headache particularly for people doing bulk-loading of data so I hope we can finally put it behind us!

### Snappy 1.1.1

Google released a new version of Snappy, version 1.1.1. I don't really understand how Google uses [semver](http://semver.org/); we get very simple LevelDB releases with the minor version bumped and then we get versions of Snappy released with non-trivial changes with only the patch version bumped. I suspect that Google doesn't know how it uses semver either and there's no internal policy on it.

Anyway, Snappy 1.1.1 has some fixes, some minor speed and compression improvements but most importantly it breaks compilation on Windows. So we had to figure out how to fix that for this release. Ugh. I also took the opportunity to clean up some of the compilation options for Snappy and we may see some improvements in the way it works now... perhaps.

### Some embarrassing bugs

[Amine Mouafik](https://github.com/kytwb) is new to the LevelDOWN repository but has picked up some rather embarrassing bugs/omissions that are probably my fault. It's great to have more eyes on the C++ code, there's not enough JavaScript programmers with the confidence to dig in to messy C++-land.

Firstly, on our standard LevelDOWN releases, it turns out that we haven't actually been enabling the internal **bloom filter**. The bloom filter was introduced in LevelDB to speed up read operations to avoid having to scan through whole blocks to find the data a read is looking for. So that's now enabled for 0.10.

Then he discovered that we had been **turning off compression** by default! I believe this happened with the the switch to NAN. The signature for reading boolean options from V8 objects was changed from internal `LD_BOOLEAN_OPTION_VALUE` & `LD_BOOLEAN_OPTION_VALUE_DEFTRUE` macros for defaulting to true and false respectively when the options aren't supplied, to the NAN version which is a unified `NanBooleanOptionValue` which takes an optional `defaultValue` argument that can be used to make the default `true`. This happened at roughly Node version 0.11.4.

Well, this code:

```c++
bool compression =
    NanBooleanOptionValue(optionsObj, NanSymbol("compression"));
```

is now this:

```c++
bool compression =
    NanBooleanOptionValue(optionsObj, NanSymbol("compression"), true);
```

so if you don't supply a `"compression"` boolean option in your db setup operation then it'll now actually be turned on!

### Domains

We've finally caught up with properly supporting Node's [domains](http://nodejs.org/docs/latest/api/domain.html) by switching all C++ `callback` calls from standard V8 `callback->Call(...)` to Node's own `node::MakeCallback(callback, ...)` which does the same thing but also does lots of additional things, including accounting for domains. This change was also included in NAN version 0.5.0.

### Summary

**Go and upgrade!**

leveldown@0.10.0 is packaged with the new levelup@0.18.0 and level@0.18.0 which have their minor versions bumped purely for this LevelDOWN release.

Also released are the packages:

 * leveldown-hyper@0.10.0
 * leveldown-basho@0.10.0
 * rocksdb@0.10.0 (based on the same LevelDOWN code) (Linux only)
 * level-hyper@0.18.0 (levelup on leveldown-hyper)
 * level-basho@0.18.0 (levelup on leveldown-basho)
 * level-rocks@0.18.0 (levelup on rocksdb) (Linux only)

I'll write more about these packages in the future since they've gone largely under the radar for most people. If you're interested in catching up then please join **##leveldb** on Freenode where there's a bunch of Node database people and also a few non-Node LevelDB people like [Robert Escriva](https://twitter.com/rescrv), author of HyperLevelDB and all-round LevelDB expert.

### *A final note on Node 0.11.9*

There will be a LevelDOWN@0.10.1 very soon that will increment the NAN dependency to 0.6.0 when it's released. This new version of NAN will specifically deal with Node 0.11.9 compatibility where there are more breaking V8 changes that will cause compile errors for any addon not taking them in to account. So if you're living on the edge in Node then we should have a release soon enough for you!
