
# A Real Database Rethink

<p style="margin-top: 120px; text-align: center; font-size: 21px; font-style: italic;"><i>@rvagg</i></p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# "NodeBase"<br><i>(or)</i> "Level*"

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

<h2 data-bespoke-bullet>Databases: a short history</h2>

<p data-bespoke-bullet>
***1960s***: From tapes and batch to disks, shared access and interactivity
</p>

<p class="tape-loading-img">
  <img src="img/fig127b.jpg">
  <span>...not a "database"</span>
</p>

<p data-bespoke-bullet>
***Late 1960s***: Navigational databases: *links*
</p>

<p data-bespoke-bullet>
***Early 1970s***: The relational model: *content*
</p>

<p data-bespoke-bullet>
***Late 1970s***: SQL
</p>

<p data-bespoke-bullet>
***Early 1980s***: A database on my desktop (dBASE and its ilk)
</p>

<p data-bespoke-bullet>
***Late 1980s***: Object Orient ALL THE THINGS!
</p>

<p data-bespoke-bullet>
***2000s***: Speed and scale: NoSQL
<br><span data-bespoke-bullet>
*"NewSQL": never let a beautiful abstraction go to waste*
</span>
</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The tyranny of a beautiful abstraction

An abstraction that fits many problems very well will be made to fit all related problems

Programmers take *Maslow's hammer* to the next level

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## So what is a Database?

**A tool for interacting with structured data, externalised from the core of our application**

 * Persistence
 * Performance
 * Simplify access to complex data

And sometimes...

 * Shared access
 * Scalability

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The Node approach

<div data-bespoke-bullet>

<ul>
 <li>Small core, vibrant user-land</li>
 <li>Extreme modularity</li>
 <li>Reimplement everything in JavaScript!</li>
</ul>

</div>
<div data-bespoke-bullet>

<p>Applied to databases?</p>

<ul>
 <li>Small core: LevelUP</li>
 <li>Everything as a module</li>
 <li>Pulling in many aspects of database *practice* &amp; *theory*</li>
</ul>

<p>
(internal data relationships, data relationship with the application, storage technology, distributed methodologies)
</p>

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

## LevelDB

 * Open-source, embedded key/value store by Google
 * Sorted by keys
 * Values are compressed with Snappy
 * Basic operations: `Get()`, `Put()`, `Del()`
 * Atomic `Batch()`
 * Bi-directional iterators

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## LevelUP

Inspired by LevelDB, but not necessarily dependent upon it

<i>Backed</i> by a key/value store for arbitrary data, sorted by key

 * Core operations: `put()`, `get()`, `del()`
 * Atomic batch writes
 * ReadStream: *the secret sauce*
 * WriteStream: *for convenience*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## ReadStream

An essential primitive for building complex features

The core query mechanism to access sorted data

Arbitrary *start* and *end*

```js
db.createReadStream({ start: 'Water', end: 'Water\xff' })
  .on('data', function (entry) {
    console.log(entry.key)
  })

// → Waterford
// → Watergrasshill
// → Waterville
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Key structure

Key-based sorting and querying requires good key *design*

Keys as hierarchical descriptors of content:

```js
'countries~Ireland'
'countries~Israel'
...
'towns~Ireland~Waterford'
'towns~Ireland~Watergrasshill'
...
'streets~Ireland~Waterford~Dunmore Road'
'streets~Ireland~Waterford~Derrynane Close'
...
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Building-blocks

**From:** a 1-dimensional storage array

**To:** a multi-dimensional data tool for customised solutions

The Level\* ecosystem: A menu of *beautiful*, but *small* abstractions

<p data-bespoke-bullet></p>

<p data-bespoke-bullet style="text-align: center; font-style: italic; padding-top: 50px; color: #444;">
  end / deireadh
  <br><img src="img/helmet1.png" style="width: 100px; margin-top: 20px;">
</p>