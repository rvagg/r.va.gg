```json
{
    "date"   : "2013-10-09"
  , "title"  : "All the levels!"
  , "author" : "Rod Vagg"
}
```

When we completely separated [LevelUP](https://github.com/rvagg/node-levelup) and [LevelDOWN](https://github.com/rvagg/node-leveldown) so that installing LevelUP didn't automatically get you LevelDOWN, we set up a new package called **[Level](https://github.com/Level/level)** that has them both as a dependency so you just need to do `var level = require('level')` and everything is done for you.

But, we now have more than just the vanilla (Google) LevelDB in LevelDOWN. We also have a HyperLevelDB version and a Basho fork. These are maintained on branches in the LevelDOWN repo and are usually released now every time a new LevelDOWN is released. They are called **leveldown-hyper** and **leveldown-basho** in npm but you need to plug them in to LevelUP yourself to make them work. We also have [Node LMDB](https://github.com/rvagg/lmdb) that's LevelDOWN compatible and a few others.

So, as of today, we've released a new, small library called **[level-packager](https://github.com/level/level-packager)** that does this bundling process so that you can feed it a LevelDOWN instance and it'll return a Level-type object that can be exported from a package like **Level**. This is meant to be used internally and it's now being used to support these new packages that are available in npm:

 * **[level-hyper](https://github.com/Level/level-hyper)** bundles the HyperLevelDB version of LevelDOWN with LevelUP
 * **[level-basho](https://github.com/Level/level-basho)** bundles the Bash fork of LevelDB in LevelDOWN with LevelUP
 * **[level-lmdb](https://github.com/Level/level-lmdb)** bundles Node LMDB with LevelUP

The version numbers of these packages will track the version of LevelUP.

So you can now simply do:

```js
var level = require('level-hyper')
var db = level('/path/to/db')
db.put('foo', 'woohoo!')
```

If you're already using **Level** then you can very easily switch it out with one of these alternatives to try them out.

Both HyperLevelDB and the Basho LevelDB fork are binary-compatible with Google's LevelDB, with one small caveat: with the latest release, LevelDB has switched to making *.ldb* files instead of *.sst* files inside a data store directory because of something about Windows backups (blah blah). Neither of the alternative forks know anything about these new files yet so you may run in to trouble if you have *.ldb* files in your store (although I'm pretty sure you can simply rename these to *.sst* and it'll be fine with any version).

Also, LMDB is completely different to LevelDB so you won't be able to open an existing data store. But you should be able to do something like this:

```js
require('level')('/path/to/level.db').createReadStream()
  .pipe(require('level-lmdb')('/path/to/lmdb.db').createWriteStream())
```

Whoa...

### A note about HyperLevelDB

Lastly, I'd like to encourage you to try the HyperLevelDB version if you are pushing hard on LevelDB's performance. The HyperDex fork is tuned for multi-threaded access for reads and writes and is therefore particularly suited to how we use it in Node. The Basho version doesn't show much performance difference mainly because they are optimising for Riak running 16 separate instances on the same server so multi-threaded access isn't as interesting for them. You should find significant performance gains if you're doing very heavy writes in particular with HyperLevelDB. Also, if you're interested in support for HyperLevelDB then pop in to ##leveldb on Freenode and bother *[rescrv](https://twitter.com/rescrv)* (Robert Escriva), author of HyperLevelDB and our resident LevelDB expert.

It's also worth nothing that HyperDex are interested in offering commercial support for people using LevelDB, not just HyperLevelDB but also Google's LevelDB. This means that anyone using either of these packages in Node should be able to get solid support if they are doing any heavy work in a commercial environment and need the surety of experts behind them to help pick up the pieces. I imagine this would cover things like LevelDB corruption and any LevelDB bugs you may run in to (we're currently looking at a subtle [batch-related LevelDB bug](https://github.com/rvagg/node-levelup/issues/171) that's come along with the 1.14.0 release, they do exist!). Talk to Robert if you want more information about commercial support.