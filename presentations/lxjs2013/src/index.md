
# JavaScript Databases II

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<div style="margin-top: 0.5em; text-align: center">
  <img src="img/ogden_lxjs2013.png" style="width: 450px; border: solid white 2px; border-radius: 5px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);">
</div>

<p style="text-align: center; font-size: 12px;">**Max Ogden** - *"JavaScript Databases"* - LXJS 2012</p>

<p>"I want to see a time where I can write a persistence function that can run in Node, the browser and anywhere else JavaScript runs."</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## So what is a Database?

**A tool for interacting with structured data, externalised from the core of our application**

 * Persistence
 * Performance
 * Simplify access to complex data

Optional extras...

 * Shared access
 * Scalability

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The Node Way&trade;

<div class="nodeapproach">
<div data-bespoke-bullet></div>
<div data-bespoke-bullet class="second"></div>

<p class="nodedb"><b>Applied to databases?</b></p>

<p>Small core, vibrant user-land</p>
<p class="nodedb item">Small core: LevelUP</p>

<p>Extreme modularity</p>
<p class="nodedb item">Everything as a module</p>

<p>Everything in JavaScript!</p>
<p class="nodedb item">Reimplementing database *practice* &amp; *theory*</p>

</div>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Inspired by LevelDB

* Open-source, embedded key/value store by Google
* Entries sorted by keys
* Basic operations: <code>Get(), Put(), Del()</code>
* Atomic <code>Batch()</code>
* Bi-directional iterators

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## LevelDB: basic architecture

<div data-bespoke-bullet></div>

<p data-bespoke-bullet>
  <b>Log Structured Merge Tree (LSM)</b>
  <img style="float: right; width: 50%; margin: 0 -1em 0 0.5em;" src="img/leveldb_simple.svg">
</p>

<ul>
  <li data-bespoke-bullet>Writes go straight into a <b>log</b></li>
  <li data-bespoke-bullet>Log is <b>flushed</b> <i>string sorted table</i> (SST) files</li>
  <li data-bespoke-bullet>SST files grow into a hierarchy of overlapping "<b>levels</b>"</li>
  <li data-bespoke-bullet>Reads <b>merge</b> the log and the level / SST data</li>
  <li data-bespoke-bullet>Cache speeds up common reads</li>
</ul>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## LevelUP: Database primitives

<br>

* Open / Close
* Get
* Put
* Del
* Batch
* ReadStream

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: ReadStream

The simplest form of a query mechanism

Basic range query:

```sh
| a | b | e | f1 | f2 | g | h | i | o | p | q | r | v |
          ↑    'e' → 'h'    ↑
          ╰─────────────────╯
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: ReadStream

The simplest form of a query mechanism

Basic range query:

```sh
| a | b | e | f1 | f2 | g | h | i | o | p | q | r | v |
          ↑    'e' → 'h'    ↑
          ╰─────────────────╯
```

```js
db.createReadStream({ start: 'e', end: 'h' })

// 'e', 'f1', 'f2', 'g', 'h'
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: ReadStream

Stab in the dark:

```sh
| a | b | e | f1 | f2 | g | h | i | o | p | q | r | v |
              ↑     ↑
              ╰─────╯
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: ReadStream

Stab in the dark:

```sh
| a | b | e | f1 | f2 | g | h | i | o | p | q | r | v |
              ↑     ↑
              ╰─────╯
```

Bytewise comparison to the rescue!

```js
db.createReadStream({ start: 'f', end: 'f~' })

// 'f1', 'f2'
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Batch

Atomic operations for sophisticated behaviour

Example: Indexes

```js
db.put('foo', { name: 'bar' })
db.put('boom', { name: 'bang' })

// ?? db.getBy('name', 'bar')
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Batch

```js
db.put('foo', { name: 'bar' })         // primary entry
db.put('index~name~bar~foo', 'foo')      // index entry

getBy = function (index, value, callback) {
  var keys = []
  return db.createReadStream({
      start : 'index~' + index + '~' + value + '~'
    , end   : 'index~' + index + '~' + value + '~~'
  }).on('data', function (entry) {
    keys.push(entry.value)
  }).on('end', function () {
    callback(null, keys)
  })
}
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Batch

```js
put = function (key, value, callback) {
  db.batch().put(key, value)            // primary entry
    .put('index~name~' + value.name + '~', key) // index
    .write(callback)                          // atomic!
}

put('foo', { name: 'bar' }, ...)

//  db.createReadStream({
//      start : 'index~' + index + '~' + value + '~'
//    , end   : 'index~' + index + '~' + value + '~~'
//  })
```

Automated with **level-hooks**

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Batch

<p style="margin: 0;">Example: Async work that *must* be performed for each entry</p>

```js
put = function (key, value, callback) {
  db.batch().put(key, value)            // primary entry
    .put('pending~' + key + '~', key)          // marker
    .write(callback)                          // atomic!
  work(key, value)
}
work = function (key, value) {
  // do some async work...
  db.del('pending~' + key + '~')
}
// on restart:
db.createReadStream({ start: 'pending~' })
  .on('data', work)
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Buckets

Like *tables*, for organising data and separating types of data

```js
db.put('~countries~Morocco', { capital: 'Rabat' })
db.put('~countries~Portugal', { capital: 'Lisbon' })
db.put('~countries~Spain', { capital: 'Madrid' })
db.put('~cities~Leiria', { population: 50264 })
db.put('~cities~Lisbon', { population: 547631 })
db.put('~cities~Lixa', { population: 5500 })
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Primitives: Buckets

Automated with **level-sublevel**

```js
db = sublevel(db)
countriesDb = db.sublevel('countries')
citiesDb = db.sublevel('cities')

countriesDb.put('Morocco', { capital: 'Rabat' })
countriesDb.put('Portugal', { capital: 'Lisbon' })
countriesDb.put('Spain', { capital: 'Madrid' })
citiesDb.put('Leiria', { population: 50264 })
citiesDb.put('Lisbon', { population: 547631 })
citiesDb.put('Lixa', { population: 5500 })

countriesDb.createReadStream().on('data', console.log)
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## LevelDOWN: Storage flexibility

<div data-bespoke-bullet>
  <ul>
    <li>LevelDB (Google)</li>
    <li>LevelDB (Basho)</li>
    <li>HyperLevelDB (HyperDex)</li>
    <li>LMDB</li>
    <li>MemDOWN</li>
    <li>mysqlDOWN</li>
    <li><i>more under development...</i></li>
  </ul>
</div>
<div data-bespoke-bullet>

<p>...and **level.js**</p>

<p>The Level* ecosystem in the browser!</p>

</div>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<table class="ecosystem">
  <tr class="tools">
    <td class="section"><span>Tools</span></td>
    <td><table><tr>
      <td>lev</td>
      <td>levelweb</td>
      <td></td>
      <td></td>
      <td></td>
    </tr></table></td>
  </tr>
  <tr class="packages">
    <td class="section"><span>Packages</span></td>
    <td><table><tr>
      <td>tacodb</td>
      <td>couchup</td>
      <td>LevelGraph</td>
      <td>firedup</td>
      <td>level-assoc</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr>
      <td>level-static</td>
      <td>level-store</td>
      <td>level-session</td>
      <td>level-fs</td>
      <td>LevelTTLCache</td>
      <td></td>
      <td></td>
      <td></td>
    </tr></table></td>
  </tr>
  <tr class="extensions">
    <td class="section"><span>Extensions</span></td>
    <td><table><tr>
      <td>level-live-stream</td>
      <td>map-reduce</td>
      <td>level-queryengine</td>
      <td>Level-Multiply</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr>
      <td>multilevel</td>
      <td>level-replicate</td>
      <td>level-master</td>
      <td>Level TTL</td>
      <td></td>
      <td></td>
      <td></td>
    </tr></table></td>
  </tr>
  <tr class="pluggability">
    <td class="section"><span>Extensibility</span></td>
    <td><table><tr>
      <td>sublevel</td>
      <td>level-hooks</td>
      <td>level-mutex</td>
      <td></td>
      <td></td>
      <td></td>
    </tr></table></td>
  </tr>
  <tr class="core">
    <td class="section"><span>Core</span></td>
    <td colspan="10">
      <table><tr><td>
        LevelUP
      </td></tr></table>
    </td>
  </tr>
  <tr class="storage">
    <td class="section"><span>Storage</span></td>
    <td colspan="10"><table><tr>
      <td class="rotate"><span><b>LevelDOWN</b></span></td>
      <td class="rotate"><span>LevelDOWN (Hyper)</span></td>
      <td class="rotate"><span>LevelDOWN (Basho)</span></td>
      <td class="rotate"><span>MemDOWN</span></td>
      <td class="rotate"><span>level.js</span></td>
      <td class="rotate"><span>leveldown-gap</span></td>
      <td class="rotate"><span>LMDB</span></td>
      <td class="rotate"><span>mysqlDOWN</span></td>
    </tr></table>
    </td>
  </tr>
</table>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
