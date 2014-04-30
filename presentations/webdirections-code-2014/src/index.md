
# Asynchronous JavaScript Patterns
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# *Embrace the Async*

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Defining *asynchronous programming*
 * History
 * Continuation-passing
 * Benefits
* Constructing basic abstractions: series, each, map, memoisation
* Advanced abstractions
 * EventEmitter
 * Streams
 * Promises
 * Continuables / thunks
* Generators for async programming

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## In the begining

Programming was about *computing*

Computers were self-contained number-crunchers

I/O was late to the game

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is not *computing*

I/O is what computers wait for

I/O is the bottleneck in the majority of programs

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is usually hidden

```java
System.out.println("Reading file...");
BufferedReader br = new BufferedReader(new FileReader("in.txt"));

try {
  StringBuilder sb = new StringBuilder();
  String line;

  while ((line = br.readLine()) != null)
    sb.append(line + "\n");

  System.out.print(sb.toString());
} finally {
  br.close();
}

System.out.println("Finished reading file!");
```

The programmer isn't prompted to consider the costs

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## I/O is expensive

<style>
table#iocost {
  font-size: 15px;
  margin: 20px auto;
}
table#iocost td, table#iocost th {
  padding: 4px 12px;
  margin: 0;
  border-bottom: #333 solid 1px;
}
</style>

<table id="iocost" cellpadding="0" cellspacing="0">
  <thead>
    <tr><th>Class</th><th>Operation</th><th>Time cost</th></tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3" style="text-align: center;">Memory</td>
      <td>L1 cache reference:</td>
      <td style="text-align: right;">1 ns</td>
    </tr>
    <tr>
      <td>L2 cache reference:</td>
      <td style="text-align: right;">4 ns</td>
    </tr>
    <tr>
      <td>Main memory reference:</td>
      <td style="text-align: right;">100 ns</td>
    </tr>
    <tr>
    <tr>
      <td rowspan="4" style="text-align: center;">I/O</td>
      <td>SSD random-read:</td>
      <td style="text-align: right;">16,000 ns</td>
    </tr>
    <tr>
      <td>Round-trip in same datacenter:</td>
      <td style="text-align: right;">500,000 ns</td>
    </tr>
    <tr>
      <td>Physical disk seek:</td>
      <td style="text-align: right;">4,000,000 ns</td>
    </tr>
    <tr>
      <td>Round-trip from US to EU:</td>
      <td style="text-align: right;">150,000,000 ns</td>
    </tr>
  </tbody>
</table>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The CPU wants to be busy

An idle CPU is a waste of a valuable resource

Solutions?

 * Multi-process
 * Threads
 * Non-blocking I/O

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## The UI introduced new challenges

I/O in the form of a human

Unpredictable

*Very* high latency

Sequential programming has limits

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Sequential programming for UIs?

```sh
#!/bin/sh

echo -n "What's your name? "
read name
runcmd() {
  echo -n "OK ${name}, what command shal I run? "
  read cmd
  echo "Here's the output of the command \`${cmd}\`, ${name}:\n"
  $cmd
  echo -n "\nMore commands ${name}? [Y/n] "
  read more
  if [ "$more" != "n" ]; then
    runcmd
  fi
}
runcmd
```

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Good UIs don't constrain the user

Wide range of:

* input devices

* user preferences

* user abilities

* users!

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Networked UIs: a perfect storm

User variability delivered over unreliable, high-latency networks

Browsers...

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## On the web, nothing is synchronous

Reactive programming is king

 * React to user events
 * React to network events
 * React to browser events

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## JavaScript<br>The King of event-driven programming

Born in the browser

Designed to respond to user-events

**Timers!** &nbsp; <span id="scroll">BREAKING NEWS: Scrolling text with DHTML!         </span>

<script>
var p = document.getElementById('scroll');
function scroll () {
  var ptxt = p.innerHTML.replace(/&nbsp;/g, ' ').split('');
  ptxt.push(ptxt.shift());
  p.innerHTML = ptxt.join('').replace(/ /g, '&nbsp;');
}
setInterval(scroll, 100)
</script>

```js
var p = document.getElementById('scroll');
function scroll () {
  var ptxt = p.innerHTML.replace(/&nbsp;/g, ' ').split('');
  ptxt.push(ptxt.shift());
  p.innerHTML = ptxt.join('').replace(/ /g, '&nbsp;');
}
setInterval(scroll, 100)
```

<p style="font-size: 10px; font-style: italic;">Warning: content may trigger intense feelings of nostalgia</p>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Asynchronicity at the extreme: Node.js

Works well for performing many complex, parallel tasks in the browser, why not on the server too?

**Async all the things!**

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

