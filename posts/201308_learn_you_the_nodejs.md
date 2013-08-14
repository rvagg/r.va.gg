```json
{
    "date"   : "2013-08-14"
  , "title"  : "Learn You The Node.js"
  , "author" : "Rod Vagg"
}
```

**[CampJS](http://campjs.com/)** has just finished, with a bigger crowd than last time around. It was lots of fun, and as usual, these events are more about meeting the people I collaborate, and socialise with online than anything else. There was a particularly large turn-out of the hackers on #polyhack, our Australian programmers channel on Freenode. Even [@mwotton](https://twitter.com/mwotton), our resident Haskell-troll was there! Lots of photos and news can be found on [Storify](http://storify.com/campjs/campjs-ii). The next one will likely be near Melbourne in February some time and I highly recommend it if you can get there.

### Learn You The Node.js For Much Win (presentation)

I was struck last CampJS how many JavaScript newbies were there, or at least people who deal with JavaScript as a secondary language and therefore only have a cursory understanding of it. And by extension, there were not many people who had much understanding of Node. So I wanted to present some intro-to-Node material this time.

I gave a 30 minute talk covering the very basics of *what Node **is***, called **Learn You The Node.js For Much Win**. Obviously the title is inspired by *[Learn You a Haskell For Great Good](http://learnyouahaskell.com/)* and *[Learn You Some Erlang For Great Good](http://learnyousomeerlang.com/)*. You can find my slides [here](http://r.va.gg/presentations/campjs-learn-you-node/) (feel free to rip them off if you need to give a similar talk somewhere!). The video may be online at some point in the future.

### Learn You The Node.js For Much Win (workshop)

<img src="https://pbs.twimg.com/media/BRWaBeeCcAA9R7v.jpg" style="border-radius:4px; border: solid 2px white; box-shadow: 1px 1px 15px rgba(0,0,0,0.4);">

The next morning, I gave a workshop on the same topic but it was much more hands-on. The inspiration for my workshop came from [NodeConf](http://www.nodeconf.com/), a couple of months earlier. [@substack](https://twitter.com/substack) and [@maxogden](https://twitter.com/maxogden) presented a workshop titled **stream adventure** which was a self-guided, interactive workshop for the terminal, built with Node. You can find it [here](https://github.com/substack/stream-adventure) and install it from npm with `npm install stream-adventure -g`, I highly recommend it.

[![NPM](https://nodei.co/npm/stream-adventure.png?downloads=true&stars=true)](https://nodei.co/npm/stream-adventure/)

I was so inspired that I stole their code and made my own workshop application! **[learnyounode](https://github.com/rvagg/learnyounode/)**. You can download and install it with `npm install learnyounode -g`.

[![NPM](https://nodei.co/npm/learnyounode.png?downloads=true&stars=true)](https://nodei.co/npm/learnyounode/)

The application itself is/was a series of 13 separate workshops. Starting off with a simple *HELLO WORLD* and ending with a JSON API HTTP server (contributed by the very clever [@sidorares](https://twitter.com/sidorares)).

![learnyounode](https://raw.github.com/rvagg/learnyounode/master/learnyounode.png)

Nobody actually managed to finish the workshops in the allotted 60 minutes, although [@alexdickson](http://twitter.com/alexdickson), an expert JavaScripter but Node-n00b was the first one I heard of finishing it not long after.

The workshops attempt to focus on some of the core concepts of Node. There's lots of console output because that's easiest to validate but it introduces filesystem I/O, both synchronous and asynchronous and moves straight on to networking because that's what Node is so good at. An *HTTP CLIENT* example, introduces HTTP and is expanded on in *HTTP COLLECT* which introduces streams. *JUGGLING ASYNC* builds on *HTTP COLLECT* to introduce the complexities of managing parallel asynchronous activities. From there, it switches from network clients to network servers, first a simple TCP server in *TIME SERVER* and then using streams to serve files in *HTTP FILE SERVER* and transforming data with *HTTP UPPERCASERER*. The final exercise presents you with a more complex, closer-to-real-world example, an HTTP API server with multiple end-points.

The entire workshop is designed to take longer than 1-hour, people ought to be able ot take it away and complete it later. It's also designed to be suitable for complete n00bs and also people with some experience, it ought to make a fun challenge for anyone already experienced with Node to see how quickly they can complete the examples (I believe I earned the honour of being the first person at NodeConf to finish stream-adventure in the allotted time!).

The Node-experts at CampJS were thankfully helping out during the workshop so there wasn't much competition going on there.

Many thanks to these expert Node nerds who hovered and helped people during the workshop and also did some test-driving of the workshop prior to the event:

 * [Nicholas Faiz](https://twitter.com/nicholasf)
 * [Christopher Giffard](https://twitter.com/cgiffard)
 * [Tim Oxley](https://twitter.com/secoif) (who also poured his heart and soul into organising CampJS)
 * [Conrad Pankoff](http://twitter.com/deoxxa)
 * [Andrey Sidorov](https://twitter.com/sidorares) (who also contributed the final exercise of the workshop)
 * [Eugene Ware](https://twitter.com/EugeneWare) (who was also brilliant all weekend, running the local [sneakernet](http://en.wikipedia.org/wiki/Sneakernet) because the network was so flakey)
 
*(I really hope I haven't missed anyone out there; so many quality nerds at CampJS!)*

<img src="https://lh5.googleusercontent.com/-tKp0U1N7XNw/UgngKk01qqI/AAAAAAAAAoc/xxAOCTqMCZ0/w600-h800-no/campJS+%252870+of+118%2529.jpg" style="border-radius:4px; border: solid 2px white; box-shadow: 1px 1px 15px rgba(0,0,0,0.4);">

*Tim Oxley making a contribution during the workshop, along with Christopher Giffard (left) and Eugene Ware (right)*

I had the [solutions](http://r.va.gg/presentations/campjs-learn-you-node/workshop.html) to the workshop ready on the big-screen and walked through some of the early solutions and talked through what was going on. I didn't expect many people to listen to those bits and the workshop was designed so you could totally zone-out and do it at your own pace if that suited.

If anyone wants to run a similar style workshop for their local meet-up, using the same content, I'd love to receive contributions to **learnyounode**. Alternatively, make your own! I extracted the core framework from **learnyounode** and it now lives separately as **[workshopper](https://github.com/rvagg/workshopper)**.

[![NPM](https://nodei.co/npm/workshopper.png?downloads=true&stars=true)](https://nodei.co/npm/workshopper/)

I would love feedback from anyone in attendance or anyone that uses this tool to run their own workshops! **learnyounode** is already listed in Max Ogden's excellent **[The Art of Node](https://github.com/maxogden/art-of-node)**, so I'm looking forward to contributions to help turn this into a really useful teaching tool.
