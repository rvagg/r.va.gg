```json
{
    "date"   : "2013-10-03"
  , "title"  : "Primitives for JS Databases (an LXJS adventure)"
  , "author" : "Rod Vagg"
}
```

I gave a talk yesterday at **[LXJS](http://2013.lxjs.org)** yesterday in the *"Infrastructure.js"* block and tried to talk about JavaScript Database Primitives; i.e. the basic building blocks we have landed on for building more complex database solutions in JavaScript.

The talk certainly wasn't as good or clear as I wanted it to be, it worked much better in my head! A huge venue with over 300 talented JavaScripters, an absolutely massive screen, bright lights and loud amplification got the better of me and I wasn't able to pull the material together how I wanted to. The introvert within me is telling me to become a recluse for a little while just to recover! My *hope* is that at least one or two people are inspired to give *database hacking* a go because it's really not that difficult once you get your head around the primitives.

Thankfully though, a portion of the material will be able to serve as the basis for the, long overdue, third part in my [three](http://dailyjs.com/2013/04/19/leveldb-and-node-1/) [part](http://dailyjs.com/2013/05/03/leveldb-and-node-2/) [DailyJS](http://dailyjs.com) series on LevelDB & Node.

In summary, inspired by LevelDB, we've ended up with a core set of primitives in [LevelUP](https://github.com/rvagg/node-levelup) that can be used to build feature-rich and advanced database functionality. **Atomic batch** and **ReadStream** are the two non-trivial primitives, open, close, get, put, del are all pretty easy to understand as primitives, although *del* is perhaps redundant but we're opting for explicitness.

My [slides are online](http://r.va.gg/presentations/lxjs2013) but hopefully I'll be able to get my DailyJS article sorted out soon and I'll be able to explain what I was trying to get at.

ReadStream as a primitive query mechanism is not too hard to understand once you get your head around key sorting and the implications for key structure. Batch is a little more subtle and relates to consistency and our ability to augment basic operations to create more complex functionality while keeping the data store in a consistent state.

I additionally raised "Buckets", or "Namespaces" as a primitive concept and discussed how [sublevel](https://github.com/dominictarr/level-sublevel) has effectively become the standard for turning a one-dimensional data store into a multi-dimensional store able to encapsulate contain sophisticated functionality behind what is essentially just a key/value store.

### Thanks to the LXJS team

It would be neglectful of me to not say how absolutely grateful I am to the LXJS team for putting so much effort into taking care of speakers; fantastic job.

LXJS is an amazing event, put on by a dedicated and very talented team of people committed to the JavaScript community and the JavaScript community in Portugal in particular. This conference sets a very high bar for community-driven conferences with the way it has managed to get so many locals (and internationals!) involved in running an event in their own time.

**David Dias, Ana Hevesi, Pedro Teixeira, Luís Reis, Nuno Job, Tiago Rodrigues, Leo Xavier, Alexander Kustov, André Rodrigues and Bruno Coelho** have managed to put on an amazing event and are some of the nicest and talented people I've met. Thank you to you all and everyone else who put on LXJS 2013, your hard work is appreciated and should be an inspiration to everyone involved in our local JavaScript communities, running events or considering running events like this.

