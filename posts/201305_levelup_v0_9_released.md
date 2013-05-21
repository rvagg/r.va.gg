```json
{
    "date"   : "2013-05-21"
  , "title"  : "LevelUP v0.9 Released"
  , "author" : "Rod Vagg"
}
```

![LevelDB](https://twimg0-a.akamaihd.net/profile_images/3360574989/92fc472928b444980408147e5e5db2fa_bigger.png)

As per my [previous post](http://r.va.gg/2013/05/levelup-v0.9-some-major-changes.html), **[LevelUP](https://github.com/rvagg/node-levelup) v0.9 has been released**!

I'm doing a quick post about this release because it's got more changes in it than we normally see, including some things worth explaining.

### Relationship to LevelDOWN

The biggest change is the removal of [LevelDOWN](https://github.com/rvagg/node-leveldown/) as a dependency, you should [review what I've already said about this](http://r.va.gg/2013/05/levelup-v0.9-some-major-changes.html) as this will impact you if you're currently using LevelUP. In short, you'll either need to explicitly `npm install leveldown` or switch to using the new [Level](https://github.com/level/level) package which bundles them both.

Along with this change, we also get better [Browserify](http://browserify.org/) support. See [level.js](https://github.com/maxogden/level.js) for more information on this.

### Chained batch

The other major change is the introduction of a new **chained batch** syntax, additional to the existing batch syntax. This method of creating and writing batch operations is much closer to the way LevelDB does batches and under certain circumstances you may find improved performance from using this method.

If you call `db.batch()` with no arguments, you'll get a `Batch` object back which has the following operations: `put()`, `del()`, `clear()` and `write()`. The first three are chainable so you can call them one after the other to build your batch. `write()` is the only method that takes a callback because it submits the batch. Until you call `write()`, the batch is transient and can be discarded.

Example from the [README](https://github.com/rvagg/node-levelup#readme):

```js
db.batch()
  .del('father')
  .put('name', 'Yuri Irsenovich Kim')
  .put('dob', '16 February 1941')
  .put('spouse', 'Kim Young-sook')
  .put('occupation', 'Clown')
  .write(function () { console.log('Done!') })
```

### Some love for WriteStream

WriteStream got some attention in this release. On the main `createWriteStream()` method and on individual `write()` calls, you can now pass some new options:

  * `'type'` can switch from the default `'put'` to `'del'` so you can make a WriteStream that only deletes when you `write({ key: 'foo' })`, or you can make individual writes delete: `write({ type: 'del', key: 'foo' })`.
  * `'keyEncoding'` and `'valueEncoding'` will switch from default encodings for the current LevelUP instance. Again, you can specify them on the main `createWriteStream()` or on individual `write()` calls.

### Other changes

  * A [race condition](https://github.com/rvagg/node-levelup/pull/128) was fixed that allowed a `put()` to write to the store before an iterator was obtained when calling `createReadStream().
  * ReadStream no longer emits a `'ready'` event.
  * The `db` property on LevelUP instances can be used to get access to LevelDOWN or whatever LevelDOWN-substitute you are using (this was `_db`).
  * Some very LevelDB-specific methods have been deprecated on LevelUP and the documentation now recommends either directly using LevelDOWN or calling via the `db` property. Specifically:
    * `db.db.approximateSize()`
    * `leveldown.repair()`
    * `leveldown.destroy()`
  * LevelDOWN got a new LevelDB method: `getProperty()` that currently understands 3 properties:
    * `db.db.getProperty('leveldb.num-files-at-levelN')`: returns the number of files at level *N*, where N is an integer representing a valid level (e.g. "0")').
    * `db.db.getProperty('leveldb.stats')`: returns a multi-line string describing statistics about LevelDB's internal operation.
    * `db.db.getProperty('leveldb.sstables')`: returns a multi-line string describing all of the *sstables* that make up contents of the current database.
  * Significantly improved ReadStream performance improvements (up to 50% faster).
  * Some LevelDOWN memory leaks discovered and fixed.
  * LevelDOWN upgraded to LevelDB@1.10.0, [details here](https://groups.google.com/forum/#!topic/node-levelup/bly-MiUzrZw).

### Who you should thank

A lot of people put in work to this release. There's a [team of people](https://github.com/rvagg/node-levelup#contributors) that can claim ownership of LevelUP, LevelDOWN and related projects and most of them have been involved in this release. You should follow these people on Twitter and GitHub!

  * **Dominic Tarr** (<a href="https://github.com/dominictarr">GitHub/dominictarr</a> / <a href="http://twitter.com/dominictarr">Twitter/@dominictarr</a>) contributed to the ReadStream fixes and is just a generally valuable &amp; awesome sage in the LevelDB + Node community.
  * **Julian Gruber** (<a href="https://github.com/juliangruber">GitHub/juliangruber</a> / <a href="http://twitter.com/juliangruber">Twitter/@juliangruber</a>) contributed the encoding options for WriteStreams and most of the work on the new chained `batch()`.
  * **Matteo Collina** (<a href="https://github.com/mcollina">GitHub/mcollina</a> / <a href="https://twitter.com/matteocollina">Twitter/@matteocollina</a>) contributed the `'type'` options for WriteStreams and most of the work on performance improvements to ReadStreams.
  * **David Björklund** (<a href="https://github.com/kesla">GitHub/kesla</a> / <a href="http://twitter.com/david_bjorklund">Twitter/@david_bjorklund</a>) also contributed work on ReadStream performance.
  * **Max Ogden** (<a href="https://github.com/maxogden">GitHub/maxogden</a> / <a href="http://twitter.com/maxogden">Twitter/@maxogden</a>) and **Anton Whalley** (<a href="https://github.com/No9">GitHub/No9</a> / <a href="https://twitter.com/antonwhalley">Twitter/@antonwhalley</a>) both worked on extracting most of the LevelDOWN test suite into [AbstractLevelDOWN](https://github.com/rvagg/node-abstract-leveldown) to form a LevelDOWN-spec that's also runnable in browser environments.
  
And others, who you can find in [this 0.9 WIP thread](https://github.com/rvagg/node-levelup/pull/129), plus additional users who reported &amp; found issues.