```json
{
    "date"   : "2018-08-30"
  , "title"  : "Node.js and the \"HashWick\" vulnerability"
  , "author" : "Rod Vagg"
}
```

The following post was originally published on the [NodeSource Blog](https://nodesource.com/blog/node-js-and-the-hashwick-vulnerability). This text is copyright NodeSource and is reproduced with permission.

---

Yesterday, veteran Node.js core contributor and former Node.js TSC member Fedor Indutny published an article on his personal blog detailing  a newly-discovered vulnerability in V8.  Named [HashWick](https://darksi.de/12.hashwick-v8-vulnerability/), this vulnerability will need to be addressed by Node.js, but as yet has not been patched.

This article will cover the details  surrounding the disclosure yesterday, and explain some of the technical background. As a patch for Node.js is not yet available, I will also present some mitigation options for users and discuss how this vulnerability is likely to be addressed by Node.js.

## Responsible disclosure

Fedor originally reported this vulnerability to V8 and the Node.js security team in May. Unfortunately, the underlying issues are complex, and Node's use of older V8 engines complicates the process of finding and applying a suitable fix. The Node.js TSC delegated responsibility to the V8 team to come up with a solution.

After reporting the vulnerability, Fedor followed a standard practice of holding off public disclosure for 90 days, and although a fix has yet to land in Node, he published high-level details of his findings. 

It is worth pointing out that Fedor’s disclosure does not contain code or specific details on how to exploit this vulnerability; moreover, to exploit HashWick a malicious party would need to tackle some fairly difficult timing analysis. However, knowledge that such a vulnerability exists, and can potentially be executed on a standard PC, is likely to spur some to reverse engineer the details for themselves.

These circumstances leave us all in an awkward situation while we wait for a fix, but I expect this disclosure to result in security releases in Node.js in the coming weeks.

## Vulnerability details

There are three important concepts involved in this vulnerability:
 1. Hash functions and hash tables
 2. Hash flooding attacks
 3. Timing analysis

### Hash functions

Hash functions are a fundamental concept in computer science. They are typically associated with cryptography, but are widely used for non-cryptographic needs. A [hash function](https://en.wikipedia.org/wiki/Hash_function) is simply any function that takes input data of some type and is able to repeatedly return output of a predictable size and range of values. An ideal hash function is one that exhibits apparent randomness and whose results spread evenly across the output range, regardless of input values.

To understand the utility of such functions, consider a "sharded" database system, divided into multiple storage backends. To route data storage and retrieval, you need a routing mechanism that knows which backend that data belongs in. Given a key, how should the routing mechanism determine where to _put_ new data, and then where to _get_ stored data when requested? A random routing mechanism isn't helpful here, unless you also want to store metadata telling you which random backend a particular key's value was placed in.

This is where hash functions come in handy. A hash function would allow you to take any given key and return a “backend identifier” value, directing the routing mechanism to assign data to a particular backend. Despite apparent randomness, a good hash function can thus distribute keys across all of your backends fairly evenly.

This concept also operates at the most basic levels of our programming languages and their runtimes. Most languages have hash tables of some kind; data structures that can store values with arbitrary keys. In JavaScript, almost any object can become a hash table because you can add string properties, and store whatever values you like. This is because `Object` is a form of hash table, and almost everything is related to `Object` in some way. `const foo = { hash: 'table' }` stores the value `'table'` at key `'hash'`. Even an `Array` can take the form of a hash table. Arrays in JavaScript are not limited to integer keys, and they can be as sparse as you like: `const a = [ 1, 2, 3 ]; a[1000] = 4; a['hash'] = 'table';`. The underlying storage of these hash tables in JavaScript needs to be practical and efficient.

If a JavaScript object is backed by a memory location of a fixed size, the runtime needs to know where in that space a particular key's value should be located. This is where hash functions come in. An operation such as `a['hash']` involves taking the string `'hash'`, running it through a hash function, and determining exactly where in the object's memory storage the value belongs. But here's the catch: since we are typically dealing with small memory spaces (a new `Array` in V8 starts off with space for only 4 values by default), a hash function is likely to produce "collisions", where the output for `'hash'` may collide with the same location as `'foo'`. So the runtime has to take this into account. V8 deals with collision problems by simply incrementing the storage location by one until an empty space can be found. So if the storage location for `'hash'` is already occupied by the value of `'foo'`, V8 will move across one space, and store it there if that space is empty. If a new value has a collision with either of these spaces, then the incrementing continues until an empty space is found. This process of incrementing can become costly, adding time to data storage operations, which is why hash functions are so important: a good hash function will exhibit maximum randomness.

### Hash flooding attacks

Hash flooding attacks take advantage of predictability, or poor randomness, in hash functions to overwhelm a target and force it to work hard to store or look up values. These attacks essentially bypass the utility of a hash function by forcing excessive work to find storage locations.

In our sharded data store example above, a hash flood attack may involve an attacker knowing exactly how keys are resolved to storage locations. By forcing the storage or look-up of values in a single backend, an attacker may be able to overwhelm the entire storage system by placing excessive load on that backend, thereby bypassing any load-sharing advantage that a bucketing system normally provides.

In Node.js, if an attacker knows exactly how keys are converted to storage locations, they may be able to send a server many object property keys that resolve to the same location, potentially causing an increasing amount of work as V8 performs its check-and-increment operations finding places to store the values. Feed enough of this colliding data to a server and it'll end up spending most of its time simply trying to figure out how to store and address it. This could be as simple as feeding a JSON string to a server that is known to parse input JSON. If that JSON contains an object with many keys that all collide, the object construction process will be very expensive. This is the essence of a denial-of-service (DoS) attack: force the server to do an excessive amount of work, preventing it from being able to perform its normal functions.

Hash flooding is a well known attack type, and standard mitigation involves very good hash functions, combined with additional randomness: ***keyed hash functions***. A keyed hash function, is a hash function that is seeded with a random key. That same seed is provided with every hash operation, so that together, the seed and an input value yield the same output value. Change the seed, and the output value is entirely different. In this way, it is not good enough to simply know the particular hash function being used, you also need to know the random seed the system is using.

V8 uses a keyed hash function for its object property storage operations (and other operations that require hash functions). It generates a random key at start-up and keeps on using that key for the duration of the application's lifetime. To execute a hash flood type attack against V8, you need to know the random seed it's using internally. This is precisely what Fedor has figured out how to do&mdash;determine the hash seed used by an instance of V8 by inspecting it from the outside. Once you have the seed, you can perform a hash flood attack and render a Node.js server unresponsive, or even crash it entirely.

### Timing attacks

We covered timing attacks in some detail in our [deep dive of the August 2018 Node.js security releases](https://nodesource.com/blog/node-js-security-release-summary-august-2018). A timing attack is a method of determining sensitive data or program execution steps, by analyzing the time it takes for operations to be performed. This can be done at a very low level, such as most of the recent high-profile vulnerabilities reported against CPUs that rely on memory look-up timing and the timing of other CPU operations.

At the application level, a timing attack could simply analyze the amount of time it takes to compare strings and make strong guesses about what's being compared. In a sensitive operation such as `if (inputValue == 'secretPassword') ...`, an attacker may feed many string variations and analyze the timing. The time it takes to process a `inputValue`s of `'a'`, `'b'` ... `'s'` may give enough information to assume the first character of the secret. Since timing differences are so tiny, it may take many passes and an average of results to be able to make strong enough inference. Timing attacks often involve a _lot_ of testing and a timing attack against a remote server will usually involve sending a _lot_ of data.

Fedor's attack against V8 involves using timing differences to work out the hash seed in use. He claims that by sending approximately 2G of data to a Node.js server, he can collect enough information to reverse engineer the seed value. Thanks to quirks in JavaScript and in the way V8 handles object construction, an external attacker can force many increment-and-store operations. By collecting enough timing data on these operations, combined with knowledge of the hash algorithm being used (which is no secret), a sophisticated analysis can unearth the seed value. Once you have the seed, a hash flood attack is fairly straightforward.

## Mitigation

There are a number of ways a Node.js developer can foil this type of attack without V8 being patched, or at least make it more difficult. These also represent good practice in application architecture so they are worth implementing regardless of the impact of this specific vulnerability.

The front-line for mitigating against timing attacks for publicly accessible network services is **rate limiting**. Note that Fedor needs to send 2G of data to determine the hash seed. A server that implements basic rate limiting for clients is likely to make it more difficult or impractical to execute such an attack. Unfortunately, such rate limiting needs to be applied _before_ too much internal V8 processing is allowed to happen. A `JSON.parse()` on an input string _before_ telling the client that they have exceeded the maximum requests for their IP address won't help mitigate. Additionally, rate limiting may not mitigate against distributed timing attacks, although these are much more difficult to execute due to the variability in network conditions across multiple clients, leading to very fuzzy timing data.

Other types of **input limiting** will also be useful. If your service blindly applies a `JSON.parse()`, or other operation, to any length of input, it will be much easier for an attacker to unearth important timing information. Ensure that you have basic input limit checks in place and your network services don't blindly process whatever they are provided.

Standard **load balancing** approaches make such attacks more difficult too. If a client cannot control which Node.js instance it is talking to for any given connection, it will be much more difficult to perform a useful timing analysis of the type Fedor has outlined. Likewise, if a client has no way to determine which unique instance it has been talking to (such as a cookie that identifies the server instance), such an attack may be impossible given a large enough cluster.

### The future for V8

As Fedor outlined in his post, the best mitigation comes from V8 fixing its weak hash function. The two suggestions he has are:

 1. Increase the hash seed size from 32 bits to 64 bits
 2. Replace the hash function with something that exhibits better randomness

The key size suggestion simply increases the complexity and cost of an attack, but doesn't make it go away. Any sufficiently motivated attacker with enough resources may be able to perform the same attack, just on a different scale. Instead of 2G of data, a lot more may need to be sent and this may be impossible in many cases.

A change of hash function would follow a practice adopted by many runtimes and platforms that require hash functions but need to protect against hash flood attacks. [SipHash](https://en.wikipedia.org/wiki/SipHash) was developed specifically for this use and has been slowly adopted as a standard since its introduction 6 years ago. Perl, Python, Rust and Haskell all use SipHash in some form for their hash table data structures.

SipHash has properties similar to constant-time operations used to mitigate against other forms of timing attacks. By analyzing the timing of the hash function, you cannot (as far as we know) make inference about the seed being used. SipHash is also fast in comparison to many other common and secure keyed hash functions, although it may not be faster than the more naive operation V8 is currently using. Ultimately, it’s up to the V8 authors to come up with an appropriate solution that takes into account the requirement for security and the importance of speed.
