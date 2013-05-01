```json
{
    "date"   : "2013-05-01 16:30:00"
  , "title"  : "LevelDB and Node: What is LevelDB Anyway?"
  , "author" : "Rod Vagg"
}
```

This is the first article in a three-part series on LevelDB and how it can be used in Node.

This article will cover the LevelDB basics and internals to provide a foundation for the next two articles. The second and third articles will cover the core LevelDB Node libraries: [LevelUP](https://github.com/rvagg/node-levelup), [LevelDOWN](https://github.com/rvagg/node-leveldown) and the rest of the LevelDB ecosystem that's appearing in Node-land.

![LevelDB](http://dailyjs.com/images/posts/leveldb.png)

### What is LevelDB?

LevelDB is an *open-source*, *dependency-free*, *embedded key/value data store*. It was developed in 2011 by Jeff Dean and Sanjay Ghemawat, researchers from Google. It's written in C++ although it has third-party bindings for most common programming languages. Including JavaScript / Node.js of course.

LevelDB is based on ideas in Google's BigTable but does not share code with BigTable, this allows it to be licensed for open source release. Dean and Ghemawat developed LevelDB as a replacement for SQLite as the backing-store for Chrome's IndexedDB implementation.

It has since seen very wide adoption across the industry and serves as the back-end to a number of new databases and is now the recommended storage back-end for Riak.

**Continue reading this article on <a href="http://dailyjs.com/2013/04/19/leveldb-and-node-1/">DailyJS.com</a>**