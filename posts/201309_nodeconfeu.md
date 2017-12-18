```json
{
    "date"   : "2013-09-27"
  , "title"  : "NodeConf.eu"
  , "author" : "Rod Vagg"
}
```

Wow, **[NodeConf.eu](http://nodeconf.eu/)** was certainly a once-in-a-lifetime event ... although there's talk of a repeat performance next year (don't miss the chance when it comes around!).

<div style="text-align: center;">
![Raise that flag](https://r.va.gg/images/2013/09/nodeconfeu_raiseflag.jpg)
<p style="text-align: center;">Dominic Tarr, @substack and Julian Gruber raising the NodeConf.eu flag</p>
</div>


NodeConf.eu was held in Waterford, Ireland, on an **Island**, in a **Castle** and was organised by the Node lovin' company, [nearForm](http://nearform.com/), in particular [Cian O'Maidin](http://cianomaidin.com/) and his amazing assistant Catherine Bradley. Of course [Mikeal Rogers](http://futurealoof.com/) had a significant role in organising the event too.

<div style="text-align: center;">
![Waterford Castle](https://r.va.gg/images/2013/09/nodeconfeu_castle.jpg)
<p style="text-align: center;">[Waterford Castle](http://waterfordcastle.com/)</p>
</div>

<div style="text-align: center;">
![Pig](https://r.va.gg/images/2013/09/nodeconfeu_pig.jpg)
<p style="text-align: center;">The welcome banquet ... yep</p>
</div>

Instead of describing the talks, I'll defer to the [excellent](http://clock.co.uk/tech-blogs/nodeconfeu-2013-part-one) [four](http://clock.co.uk/tech-blogs/nodeconfeu-2013-part-two) [part](http://clock.co.uk/tech-blogs/nodeconfeu-2013-part-three) [series](http://clock.co.uk/tech-blogs/nodeconfeu-reflection) by Paul, Adam, Luke and Ben of [Clock](http://clock.co.uk/) where you'll find a great summary of the talks and events of the conference.

For my part, I was deeply honoured to be involved in the *"Node Databases"* track of the conference. We started off the NodeConf.eu talks with a 3-part show. My talk was titled "A Real Database Rethink" and was followed by [Dominic Tarr](https://twitter.com/dominictarr) who talked more about the Level* ecosystem and the various pieces of the Node Databases puzzle that's being built. [Julian Gruber](http://juliangruber.com/) then closed us off with some amazing live-coding of some browser/server streaming LevelUP/multilevel [wizardry](https://github.com/juliangruber/nodeconfeu-13).

### A Real Database Rethink

The slides of my talk are [online](https://r.va.gg/presentations/nodeconfeu.2013/). I attempted to break down the definition of the term *"database"* by looking at where the concept comes from historically. It's actually a difficult thing to define and I don't believe there is any one agreed upon meaning. What I came up with is:

> A tool for interacting with structured data, externalised from the core of our application
>
>  * Persistence
>  * Performance
>  * Simplify access to complex data
>
> And sometimes...
>
>  * Shared access
>  * Scalability

But even that's pretty rough.

Taking that definition, we can apply Node philosophy of small-core and vibrant user-land, along with the culture of extreme modularity afforded us by npm, and build a new kind of database; or at least apply new thinking to the "database".

The bulk of my talk was taken up with talking about LevelUP and the basics of the Level* ecosystem. There's a table on slide #7 that I'm going to try and refine over time to help describe what the Level* / NodeBase world is all about.

### Level Me Up Scotty!

One of the three workshops available at NodeConf.eu was all about Node Databases. I took the same approach as at [CampJS](http://campjs.com/) recently where I built [Learn You The Node.js For Much Win!](https://r.va.gg/2013/08/learn-you-the-node.js.html), a tool that owes a debt to [stream-adventure](https://github.com/substack/stream-adventure), a self-guided workshop-in-your-terminal application by [@substack](https://twitter.com/substack) and [Max Ogden](https://twitter.com/maxogden) written for NodeConf (US).

This time around, I received some great help from both @substack and Julian Gruber who helped write some exercises, I also received help from [Eugene Ware](http://twitter.com/eugeneware) who wasn't even at the conference but was assisting with development from Australia. [Raynos](http://twitter.com/raynos2) was also a great help in getting the application working well.

We ended up with ***Level Me Up Scotty!***, or just **levelmeup**.

<div style="text-align: center;">
![levelmeup](https://raw.github.com/rvagg/levelmeup/master/levelmeup.png)
</div>

Dominic Tarr, [Thorsten Lorenz](https://twitter.com/thlorenz), [Paolo Fragomeni](https://twitter.com/hij1nx), [Matteo Collina](http://www.matteocollina.com/), [Magnus Skog](https://twitter.com/ralphtheninja), Max Ogden and other experienced *Levelers* helped on and off while the workshops were happening; so we had plenty of expertise at hand whenever there were questions.

Workshops were unstructured and the organisers of each workshop all ended up agreeing that we should just let people come and go as they pleased. This suited us as the workshop was open-ended and designed not to be finished by most people within the originally planned hour *(I think that was the original plan)*.

**[levelmeup](https://github.com/rvagg/levelmeup)** is installed from npm (`npm install levelmeup -g`) and is fully self-guided. You run the `levelmeup` application and it steps you through some exercises designed to:

 * introduce you to the format of the workshops with a simple "Hello World" style exercise
 * introduce you to LevelUP and its basic operations
 * help you understand ReadStream and the range-queries it makes possible
 * encourage creative thought regarding key structure
 * introduce [sublevel](https://github.com/dominictarr/level-sublevel)
 * introduce [multilevel](https://github.com/juliangruber/multilevel)

There's more planned for the future of this workshop application too, Matteo even has an a [work-in-progress exercise](https://github.com/rvagg/levelmeup/pull/19) that should be merged fairly soon.

**[nodeschool.io](http://nodeschool.io/)** was hatched from NodeConf.eu and pulls together the three workshop applications currently available in npm. I believe this was an initiative of [Brian J. Brennan](https://twitter.com/brianloveswords) and other Mozillans on the [Open Badges](http://openbadges.org/) project. **[workshopper](https://github.com/rvagg/workshopper)** is the engine that runs both learnyounode and levelmeup and we're trying to make it even easier for others to author their own workshop applications. There is already a [Functional Javacript Workshop](https://github.com/timoxley/functional-javascript-workshop/) by [Tim Oxley](https://twitter.com/secoif) and there are more in development. Exciting times!

<div style="text-align: center;">
![Level Me Up Workshoppers](https://r.va.gg/images/2013/09/nodeconfeu_levelmeup.jpg)
<p style="text-align: center;">Workshoppers stretching their brains with **levelmeup**</p>
</div>

My experience with **stream-adventure** and **learnyounode** suggested that this format should prove to be relatively successful but ultimately I think we had most of the attendees come through at some point and sit down to have a crack at the workshop. This is particularly impressive given that [Emily Rose](http://nexxylove.tumblr.com/), [Elijah Insua](http://tmpvar.com/) and Matteo were running a NodeBots workshop which included Arduino and NodeCopter hacking (always popular!). And [Max Bruning](https://twitter.com/mrbruning) and [TJ Fontaine](https://twitter.com/tjfontaine) were running a Manta / MDB / DTrace / SmartOS-magic workshop and their material was some of my favourite from NodeConf (US) so I'm sure people really enjoyed what they had to present.

Unfortunately I didn't get to attend these other workshops, I also missed out on some skeet!

<div style="text-align: center;">
![Skeet](https://farm6.staticflickr.com/5338/9726258926_e3ea4a656f_z.jpg)
<p style="text-align: center;">Karolina *"don't mess with me"* Szczur, photo by [Matthew Bergman](http://www.flickr.com/photos/matthewbergman/sets/72157635446400980/)</p>
</div>

But there was plenty of other *experience* to be had. It was also fantastic to meet so many people I only knew from IRC / Twitter / GitHub. For someone who lives in regional Australia and doesn't get a chance to socialise much with other nerds, this was a particularly special opportunity.

<div style="text-align: center;">
![Shenanigans](https://farm8.staticflickr.com/7392/9783982165_43ca4edef2_z.jpg)
<p style="text-align: center;">Final night banquet shenanigans with [Charlie McConnell](https://twitter.com/Av1anFlu) and @substack ... the napkin hat thing is a story in itself, blame [Jessica Lord](https://twitter.com/jllord), photo by [Matthew Bergman](http://www.flickr.com/photos/matthewbergman/sets/72157635446400980/)</p>
</div>

### The Level* Gang

As an aside, NodeConf.eu had the largest concentration of LevelUP contributors and active Level* developers of any event that I'm aware of so far. So we took the opportunity to have our own little meeting. We even took minutes, [of sorts](https://github.com/karolinaszczur/leveldb.org/blob/master/meetup-nodeland).

There has been a long-standing plan to make a Level* / NodeBase website but being the disorganised rabble we are, it hasn't got off the ground. Karolina (and Jessica too I believe) are keen to help out on the design end but just need the content. So that's what we planned. There's a bunch of issues that form a TODO in the [repo](https://github.com/karolinaszczur/leveldb.org/issues) for this project. Hopefully we can all get on top of it sooner rather than later. We're also open to assistance from anyone else that would like to contribute.

Besides getting stuff done, it was just a pleasure to hang out with these people and talk *shop*.

<div style="text-align: center;">
![A momentus event](https://r.va.gg/images/2013/09/nodeconfeu_levelgang.jpg)
<p style="text-align: center;">**The Level* Gang**: Paolo, Dominic, @substack, Karolina, Magnus, Mikeal, Julian, Max, Matteo and [Paul Fryzel](https://twitter.com/paulfryzel). Raynos was around but missed this particular *event*, Thorsten was inside demoing his guitar-typing software.</p>
</div>
