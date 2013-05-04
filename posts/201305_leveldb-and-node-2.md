```json
{
    "date"   : "2013-05-04"
  , "title"  : "LevelDB and Node: Getting Up and Running"
  , "author" : "Rod Vagg"
}
```

This is the second article in a three-part series on LevelDB and how it can be used in Node.

<ul class="parts">
  <li><a href="http://dailyjs.com/2013/04/19/leveldb-and-node-1/">Part 1: What is LevelDB Anyway?</a></li>
  <li><a href="http://dailyjs.com/2013/05/03/leveldb-and-node-2/"><strong>Part 2: Getting Up and Running</strong></a></li>
</ul>

Our first article covered the basics of LevelDB and its internals. If you haven't already read it you are encouraged to do so as we will be building upon this knowledge as we introduce the Node interface in this article.

![LevelDB](http://dailyjs.com/images/posts/leveldb.png)

There are two primary libraries for using LevelDB in Node, **[LevelDOWN](https://github.com/rvagg/node-leveldown)** and **[LevelUP](https://github.com/rvagg/node-levelup)**.

**LevelDOWN** is a pure C++ interface between Node.js and LevelDB. Its API provides limited *sugar* and is mostly a straight-forward mapping of LevelDB's operations into JavaScript. All I/O operations in LevelDOWN are asynchronous and take advantage of LevelDB's thread-safe nature to parallelise reads and writes.

**LevelUP** is the library that the majority of people will use to interface with LevelDB in Node. It wraps LevelDOWN to provide a more Node.js-style interface. Its API provides more *sugar* than LevelDOWN, with features such as optional arguments.

LevelUP exposes iterators as Node.js-style object streams. A LevelUP **ReadStream** can be used to read sequential entries, forward or reverse, to and from any key.

LevelUP handles JSON and other encoding types for you. For example, when operating on a LevelUP instance with JSON value-encoding, you simply pass in your objects for writes and they are serialised for you. Likewise, when you read them, they are deserialised and passed back in their original form.

**Continue reading this article on <a href="http://dailyjs.com/2013/05/03/leveldb-and-node-2/">DailyJS.com</a>**