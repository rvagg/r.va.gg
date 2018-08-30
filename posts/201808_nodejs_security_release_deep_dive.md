```json
{
    "date"   : "2018-08-30"
  , "title"  : "Background Briefing: August Node.js Security Releases"
  , "author" : "Rod Vagg"
}
```

The following post was originally published on the NodeSource Blog as [Node.js Security Release Summary - August 2018](https://nodesource.com/blog/node-js-security-release-summary-august-2018). This text is copyright NodeSource and is reproduced with permission. This is a deep-dive into the security vulnerabilities described in my brief summary on the Node.js blog as [August 2018 Security Releases](https://nodejs.org/en/blog/vulnerability/august-2018-security-releases/).

---

This month's Node.js security releases are primarily focused on upgrades to the OpenSSL library. There are also two minor Node.js security-related flaws in Node.js' `Buffer` object. All of the flaws addressed in the OpenSSL upgrade and the fixes to `Buffer` can be classified as either "low" or "very low" in severity. However, this assessment is generic and may not be appropriate to your own Node.js application. It is important to understand the basics of the flaws being addressed and make your own impact assessment. Most users will not be impacted at all by the vulnerabilities being patched but specific use-cases may cause a high severity impact. You may also be exposed via packages you are using via npm, so upgrading as soon as practical is always recommended.

Node.js switched to the new 1.1.0 release line of OpenSSL for version 10 earlier this year. Before Node.js 10 becomes LTS in October, we expect to further upgrade it to OpenSSL 1.1.1 which will add TLS 1.3 support. Node.js' current LTS lines, 8 ("Carbon") and 6 ("Boron") will continue to use OpenSSL 1.0.2.

In the meantime, OpenSSL continues to support their 1.1.0 and 1.0.2 release lines with a regular stream of security fixes and improvements and Node.js has adopted a practice of shipping new releases with these changes included shortly after their release upstream. Where there are non-trivial "security" fixes, Node.js will generally ship LTS releases with only those security fixes so users have the ability to drop in low-risk upgrades to their deployments. This is the case for this month's releases.

The August OpenSSL releases of versions 1.1.0i and 1.0.2p are technically labelled "bug-fix" releases [by the OpenSSL team](https://mta.openssl.org/pipermail/openssl-announce/2018-August/000129.html) but they do include security fixes! The reason this isn't classified as a security release is that those security fixes have already been disclosed and the code is available on GitHub. They are low severity, and one of the three security items included doesn't even have a CVE number assigned to it. However, this doesn't mean they should be ignored. You should be aware of the risks and possible attack vectors before making decisions about rolling out upgrades.

## OpenSSL: Client DoS due to large DH parameter ([CVE-2018-0732](https://www.openssl.org/news/secadv/20180612.txt))

All actively supported release lines of Node.js are impacted by this flaw. Patches are included in both OpenSSL 1.1.0i (Node.js 10) and 1.0.2p (Node.js 6 LTS "Boron" and Node.js 8 LTS "Carbon").

This fixes a potential denial of service (DoS) attack against _client_ connections by a malicious server. During a TLS communication handshake, where both client and server agree to use a cipher-suite using DH or DHE (Diffie–Hellman, in both ephemeral and non-ephemeral modes), a malicious server can send a very large prime value to the client. Because this has been unbounded in OpenSSL, the client can be forced to spend an unreasonably long period of time to generate a key, potentially causing a denial of service.

We would expect to see a higher severity for this bug if it were reversed and a client could impose this tax on servers. But in practice, there are more limited scenarios where a denial of service is practical against client connections.

The [fix](https://github.com/openssl/openssl/commit/ea7abeeab) for this bug in OpenSSL limits the number of bits in the prime modulus to 10,000 bits. Numbers in excess will simply fail the DH handshake and a standard SSL error will be emitted.

Scenarios where Node.js users may need to be concerned about this flaw include those where your application is making client TLS connections to untrusted servers, where significant CPU costs in attempting to establish that connection is likely to cause cascading impact in your application. A TLS connection could be for HTTPS, encrypted HTTP/2 or a plain TLS socket. An "untrusted server" is one outside of your control and not in the control of trustworthy third-parties. An application would likely need to be forced to make a large number of these high-cost connections for an impact to be felt, but you should assess your architecture to determine if such an impact is likely, or even possible.

## OpenSSL: Cache timing vulnerability in RSA key generation ([CVE-2018-0737](https://www.openssl.org/news/secadv/20180416.txt))

Node.js is not impacted by this vulnerability as it doesn't expose or use RSA key generation functionality in OpenSSL. However, it is worth understanding some of the background of this vulnerability as we are seeing an increasing number of software and hardware flaws relating to potential timing attacks. Programming defensively so as to not expose the timing of critical operations in your application is just as important as sanitizing user input while constructing SQL queries. Unfortunately, timing attacks are not as easy to understand, or as obvious, so tend to be overlooked.

Side-channel attacks are far from new, but there is more interest in this area of security, and researchers have been focusing  more attention on novel ways to extract hidden information. [Spectre and Meltdown](https://spectreattack.com/) are the two recent high-profile examples that target CPU design flaws. CVE-2018-0737 is another example, and itself uses hardware-level design flaws. A [paper](https://eprint.iacr.org/2018/367.pdf) by Alejandro Cabrera Aldaya, Cesar Pereida García, Luis Manuel Alvarez Tapia and Billy Bob Brumley from Universidad Tecnológica de la Habana (CUJAE), Cuba, and Tampere University of Technology, Finland outlines a cache-timing attack on RSA key generation, the basis of this OpenSSL flaw.

The CVE-2018-0737 flaw relies on a "[Flush+Reload attack](https://www.usenix.org/node/184416)" which targets the last-level of cache on the system (L3, or level-3 cache on many modern processors). This type of attack exploits the way that Intel x86 architectures structure their cache and share it between processors and processes for efficiency. By setting up a local process that shares an area of cache memory with another process you wish to attack, you can make high-confidence inferences about the code being executed in that process. The attack is called "Flush+Reload" because the process executing the attack, called the "spy", causes a flush on the area of cache containing a piece of critical code, then waits a small amount of time and reloads that code in the cache. By measuring the amount of time the reload takes, the spy can infer whether the process under attack loaded, and therefore executed, the code in question or not. This attack looks at code being executed, not data, but in many cryptographic calculations, the sequence of operations can tell you all you need to know about what data is being generated or operated on. These attacks have been successfully demonstrated against different implementations of RSA, ECDSA and even AES. The attack has been shown to work across virtual machines in shared environments under certain circumstances. One researcher even demonstrated the ability to detect the sequence of operations executed by a user of `vi` on a shared machine.

An important take-away about cache-timing attacks is that they require local access to the system under attack. They are an attack type that probes the physical hardware in some way to gather information. Public clouds are usually not vulnerable because of the way cache is configured and partitioned, but we shouldn't assume we won't see new novel timing attacks that impact public clouds in the future. Of course browsers blur the definition of "local code execution", so we shouldn't be complacent! CVE-2018-0737 is marked as "Low" severity by the OpenSSL team because of the requirement for local access, the difficulty in mounting a successful attack and the rare circumstances in which an attack is feasible.

The best protection against Flush+Reload and many other classes of timing attacks is to use **constant-time operations** for cryptographic primitives and operations that expose potentially sensitive information. If an operation follows a stable code path and takes a constant amount of time regardless of input or output then it can be hard, or impossible to make external inference about what is going on. An operation as simple as `if (userInput === 'supersecretkey') { ... }` can be vulnerable to a timing attack if an attacker has the ability to execute this code path enough times. In 2014, as the PHP community debated switching certain operations to constant-time variants, [Anthony Ferrara](https://blog.ircmaxell.com/2014/11/its-all-about-time.html) wrote a great piece about timing attacks and the types of mitigations available. Even though it addresses PHP specifically, the same concepts are universal.

The fix that OpenSSL applied for CVE-2018-0737 was a straight-forward switch to constant-time operations for the code in question. For RSA, this has the effect of masking the operations being performed from side-channel inspection, such as the use of cache.

Be aware that Node.js has a [`crypto.timingSafeEqual()`](https://nodejs.org/docs/latest-carbon/api/crypto.html#crypto_crypto_timingsafeequal_a_b) operation that can be used whenever performing sensitive comparisons. Using this function, our vulnerable operation becomes `if (crypto.timingSafeEqual(Buffer.fromString(userInput), Buffer.fromString('supersecretkey')) { ... }` and we stop exposing timing information to potential attackers.

## OpenSSL: ECDSA key extraction local side-channel

All actively supported release lines of Node.js are impacted by this flaw. Patches are included in both OpenSSL 1.1.0i (Node.js 10) and 1.0.2p (Node.js 6 LTS "Boron" and Node.js 8 LTS "Carbon").

This flaw does not have a CVE due to OpenSSL policy to not assign itself CVEs for local-only vulnerabilities that are more academic than practical. This vulnerability was discovered by [Keegan Ryan at NCC Group](https://www.nccgroup.trust/us/our-research/technical-advisory-return-of-the-hidden-number-problem/) and impacts many cryptographic libraries including LibreSSL, BoringSSL, NSS, WolfCrypt, Botan, libgcrypt, MatrixSSL, and of course OpenSSL. A CVE was assigned for this issue specifically for libgcrypt, CVE-2018-0495.

This flaw is very similar to the above RSA key generation cache-timing flaw in that it also uses cache-timing and an attacker must be able to execute code on the local machine being attacked. It also uses a Flush+Reload to infer the operations being performed but this time it examines Digital Signature Algorithm (DSA) the Elliptic Curve Digital Signature Algorithm (ECDSA), but a little more information is required to mount a successful attack. In an attack scenario, the victim uses a private key to create several signatures. The attacker observes the resulting signatures must know the messages being signed. Then, the cache-timing side-channel is used to infer order of operations and backfill to find the private key.

This attack could be used against TLS, or SSH, and there are mechanisms in both that would give an attacker enough information to perform a successful attack under certain circumstances. The key component again being local access to a server performing the DSA or ECDSA signing operation, or access to a virtual machine on the same host as long as cache isn't partitioned as it often is for public clouds.

Unlike the RSA flaw, a fix is not as simple as switching to constant-time operations. Instead, the [fix](https://github.com/openssl/openssl/pull/6523) involves adding a [“blinding”](https://en.wikipedia.org/wiki/Blinding_(cryptography)) to the calculation. Blinding is a technique that can mask the underlying operation from side-channel inspection by inserting unpredictability which can be later reversed. This specific fix addresses the problematic addition (`+`) operation which exposes the side-channel leak. It does this by adding a random value as noise to both sides of the equation. Now, when observing the operation, it is theoretically impossible to remove the noise and discover the important information that would leak data.

## Unintentional exposure of uninitialized memory in `Buffer` creation (CVE-2018-7166)

All versions of Node.js 10 are impacted by this flaw. Prior release lines are not impacted.

Node.js TSC member Сковорода Никита Андреевич (Nikita Skovoroda / [@ChALkeR](https://github.com/chalker)) discovered an argument processing flaw that causes causes `Buffer.alloc()` to return uninitialized memory. This method is intended to be safe and only return initialized, or cleared, memory.

Memory is not automatically cleared after use by most software and it is not generally cleared within Node.js during an application's lifetime when memory is freed from internal use. This means that a call to `malloc()` (system memory allocation) usually returns a block of memory that contains data stored by the previous user of that block who `free()`d it without clearing it. This can cause problems if an attacker can find a way to create these blocks and inspect their contents as secrets usually pass through memory—passwords, credit card numbers, etc. Allocate enough blocks of uncleared memory and you're bound to find something interesting.

In the browser, you have no way to allocate uninitialized memory, so a malicious site can't inspect your memory to find sensitive data arising from your interactions with another site. [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) and the various [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) types will only ever give you initialized, or zeroed memory—memory that contains only `0`s.

Historically, for the sake of performance, Node.js has acted more like a traditional un-sandboxed server-side runtime that doesn't need the same kinds of protections as browsers. Unfortunately, many JavaScript programmers are not as attuned to the risks of using uninitialized memory. Additionally, the `Buffer` constructor itself has some usability flaws that have lead to many expert programmers exposing uninitialized memory to potential attackers. [ws](https://github.com/websockets/ws), the very popular WebSocket library, authored by skilled programmers, [famously exposed uninitialized memory](https://github.com/websockets/ws/releases/tag/1.0.1) to client connections over the network by means of a simple remote `ping()` call that passed an integer instead of a string.

The usability concerns around `Buffer` lead to the deprecation of the `Buffer()` constructor and introduction of new factory methods: [`Buffer.from()`, `Buffer.alloc()`,  `Buffer.allocUnsafe()`](https://nodejs.org/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe), and the [`--zero-fill-buffers`](https://nodejs.org/api/buffer.html#buffer_the_zero_fill_buffers_command_line_option) command line argument. It's worth noting that from version 1.0, [N|Solid](https://nodesource.com/products/nsolid), NodeSource's enterprise Node.js runtime, included a `"zeroFillAllocations"` option in its [policies](https://docs.nodesource.com/latest/docs#polices) feature to address similar concerns.

Unfortunately, the root cause of `Buffer` constructor usability concerns—too much flexibility in argument types—is still with us, this time in [`Buffer#fill()`](https://nodejs.org/api/buffer.html#buffer_buf_fill_value_offset_end_encoding) who's signature is far too flexible: `Buffer#fill(value[, offset[, end]][, encoding])`. Internal re-use of this function, and its flexible argument parsing, by `Buffer.alloc()` exposes a bug that allows a supposedly _safe_ allocation method to return _unsafe_ (i.e. uninitialized) memory blocks.

`Buffer.alloc()` allows a third argument, `encoding`. When there is a second argument, `fill`, this and the `encoding` argument are passed blindly to the internal `fill()` implementation as second and third arguments. This is where it encounters the familiar `Buffer()` constructor problem:

```js
function _fill(buf, val, start, end, encoding) {
 if (typeof val === 'string') {
   if (start === undefined || typeof start === 'string') {
     encoding = start;
     start = 0;
     end = buf.length;
   } else if (typeof end === 'string') {
     encoding = end;
     end = buf.length;
   }
   // ...
```

The intention here is that by only passing three arguments, with the third one being `encoding`, the flexible argument parsing rules would enter the top set of instructions and set `encoding = start`, `start = 0`, `end = buf.length`, precisely what we want for a `Buffer` fully initialized with the provided `val`. However, because `Buffer.alloc()` does minimal type checking of its own, the `encoding` argument could be a number and this whole block of argument rewriting would be skipped and `start` could be set to some arbitrary point in the `Buffer`, even the very end, leaving the whole memory block uninitialized:

```
> Buffer.alloc(20, 1)
<Buffer 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01>
> Buffer.alloc(20, 'x')
<Buffer 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78>
> Buffer.alloc(20, 1, 20)
<Buffer 80 be 6a 01 01 00 00 00 ff ff ff ff ff ff ff ff 00 00 00 00>
// whoops!
```

This is only a security concern if you are allowing unsanitized user input to control the third argument to `Buffer.alloc()`. Unless you are fully sanitizing and type-checking everything coming in from an external source and know precisely what types are required by your dependencies, you should not assume that you are not exposed.

The [fix](https://github.com/nodejs/node/commit/40a7beeddac9b9ec9ef5b49157daaf8470648b08) for CVE-2018-7166 simply involves being explicit with internal arguments passed from `alloc()` to `fill()` and bypassing the argument shifting code entirely. Avoiding argument cleverness is a good rule to adopt in any case for robustness and security.

## Out of bounds (OOB) write in `Buffer` (CVE-2018-12115)

All actively supported release lines of Node.js are impacted by this flaw.

Node.js TSC member Сковорода Никита Андреевич (Nikita Skovoroda / [@ChALkeR](https://github.com/chalker)) discovered an OOB write in `Buffer` that can be used to write to memory outside of a `Buffer`'s memory space. This can corrupt unrelated `Buffer` objects or cause the Node.js process to crash.

`Buffer` objects expose areas of raw memory in JavaScript. Under the hood, this is done in different ways depending on how the `Buffer` is created and how big it needs to be. For `Buffer`s less than 8k bytes in length created via `Buffer.allocUnsafe()` and from most uses of `Buffer.from()`, this memory is allocated from a pool. This pool is made up of areas of block-allocated memory larger than an individual `Buffer`. So `Buffer`s created sequentially will often occupy adjoining memory space. In other cases, memory space may sit adjacent with some other important area of memory used by the current application—likely an internal part of V8 which makes heaviest use of memory in a typical Node.js application.

CVE-2018-12115 centers on `Buffer#write()` when working with UCS-2 encoding, (recognized by Node.js under the names `'ucs2'`, `'ucs-2'`, `'utf16le'` and `'utf-16le'`) and takes advantage of its two-bytes-per-character arrangement.

Exploiting this flaw involves confusing the UCS-2 string encoding utility in Node.js by telling it you wish to write new contents in the second-to-last position of the current `Buffer`. Since one byte is not enough for a single UCS-2 character, it should be rejected without changing the target `Buffer`, just like any `write()` with zero bytes is.  The UCS-2 string encoding utility is written with the assumption that it has at least one whole character to write, but by breaking this assumption we end up setting the "maximum number of characters to write" to `-1`, which, when passed to V8 to perform the [write](https://v8docs.nodesource.com/node-10.6/d2/db3/classv8_1_1_string.html#a79d9a617e12421ae3afb7a2060eb6fe4), is interpreted as "all of the buffer you provided".

UCS-2 encoding can therefore be tricked to write as many bytes as you want from the second-to-last position of a `Buffer` on to the next area of memory. This memory space may be occupied by another `Buffer` in the application, or even to another semi-random memory space within our application, corrupting state and potentially causing an immediate segmentation fault crash. At best this can be used for a denial of service by forcing a crash. At worst, it could be used to overwrite sensitive data to trick an application into unintended behavior.

As with CVE-2018-7166, exploiting this flaw requires the passing of unsanitized data through to `Buffer#write()`, possibly in both the data to be written and the position for writing. Unfortunately, this is not an easy scenario to recognize and such code has been found to exist in npm packages available today.

The [fix](https://github.com/nodejs/node/commit/88105c998ef9d3f54aa8f22b82ec8cc31cbfac95) for CVE-2018-12115 involves checking for this underflow and bailing early when there really are no full UCS-2 characters to write.
