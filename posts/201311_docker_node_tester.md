```json
{
    "date"   : "2013-11-26"
  , "title"  : "Testing code against many Node versions with Docker"
  , "author" : "Rod Vagg"
}
```

I haven't found reason to play with [Docker](http://www.docker.io) until now, but I've finally came up with an excellent use-case.

[NAN](https://github.com/rvagg/nan) is a project that helps build native Node.js add-ons while maintaining compatibility with Node and V8 from Node versions 0.8 onwards. V8 is currently undergoing major internal changes which is making add-on development very difficult; NAN's purpose is to abstract that pain. Instead of having to manage the difficulties of keeping your code compatible across Node/V8 versions, NAN does it for you. But this means that we have to be sure to keep NAN tested and compatible with all of the versions it claims to support.

[Travis](https://travis-ci.org/) can help a little with this. It's possible to use [nvm](https://github.com/creationix/nvm) to test across different versions of Node, we've tried this with NAN (see the [.travis.yml](https://github.com/rvagg/nan/blob/ba82a9c1fba01b3df553ac624aeaf15ca3688315/.travis.yml)). Ideally you'd have better choice of Node versions, but Travis have had some [difficulty](https://github.com/travis-ci/travis-ci/issues/1328) keeping up. Also, npm bugs make it difficult, with a high failure rate from npm install problems, like [this](https://travis-ci.org/rvagg/nan/jobs/14440485) and [this](https://travis-ci.org/rvagg/nan/jobs/14474613), so I don't even publish the badge on the NAN README.

The other problem with Travis is that it's a CI solution, not a proper testing solution. Even if it worked well, it's not really that helpful in the development process, you need rapid feedback that your code is working on your target platforms (this is one reason why I love back-end development more than front-end development!)

Enter Docker and **[DNT](https://github.com/rvagg/dnt)**

<div style="margin: 0 auto;">
  <img src="https://www.docker.com/sites/default/files/legal/small_v.png" width="114" height="114">
  <img src="https://nodejs.org/images/logos/nodejs-dark.png" width="212" height="114">
  <img src="https://img.pandawhale.com/29490-Picard-applause-clapping-gif-s5nz.gif" width="151" height="114">
</div>

### DNT: Docker Node Tester

Docker is a tool that simplifies the use of Linux containers to create lightweight, isolated compute "instances". Solaris and its variants have had this functionality for years in the form of "zones" but it's a fairly new concept for Linux and Docker makes the whole process a lot more friendly.

**DNT** contains two tools that work with Docker and Node.js to set-up containers for testing and run your project's tests in those containers.

<div style="margin: 0 auto;">
  <img src="https://r.va.gg/images/2013/11/nan-dnt.png">
</div>

**DNT** includes a `setup-dnt` script that sets up the most basic Docker images required to run Node.js applications, nothing extra. It first creates an image called "dev_base" that uses the default Docker "ubuntu" image and adds the build tools required to compile and install Node.js

Next it creates a "node_dev" image that contains a complete copy of the Node.js [source repository](http://github.com/joyent/node). Finally, it creates a series of images that are required; for each Node version, it creates an image with Node installed and ready to use.

Setting up a project is a matter of creating a *.dntrc* file in the root directory of the project. This configuration file involves setting a `NODE_VERSIONS` variable with a list of all of the versions of Node you want to test against, and this can include "master" to test the latest code from the Node repository. You also set a `TEST_CMD` variable with a series of commands required to set up, compile and execute your tests. The `setup-dnt` command can be run against a *.dntrc* file to make sure that the appropriate Docker images are ready. The `dnt` command can then be used to execute the tests against all of the Node versions you specified.

Since Docker containers are completely isolated, **DNT** can run tests in parallel as long as the machine has the resources. The default is to use the number of cores on the computer as the concurrency level but this can be configured if not appropriate.

Currently **DNT** is designed to parse TAP test output by reading the final line as either "ok" or "not ok" to report test status back on the command-line. It is configurable but you need to supply a command that will transform test output to either an "ok" or "not ok" (`sed` to the rescue?).

### How I'm using it

My primary use-case is for testing **NAN**. The test suite needs a lot of work so being able to test against all the different V8 and Node APIs while coding is super helpful; particularly when tests run so quickly! My NAN *.dntrc* file tests against master, all of the 0.11 releases since 0.11.4 (0.11.0 to 0.11.3 are explicitly not supported by NAN) and the last 5 releases of the 0.10 and 0.8 series. At the moment that's 17 versions of Node in all and on my computer the test suite takes approximately 20 seconds to complete across all of these releases.

**The NAN [.dntrc](https://raw.github.com/rvagg/nan/master/.dntrc)**

```sh
NODE_VERSIONS="\
  master   \
  v0.11.9  \
  v0.11.8  \
  v0.11.7  \
  v0.11.6  \
  v0.11.5  \
  v0.11.4  \
  v0.10.22 \
  v0.10.21 \
  v0.10.20 \
  v0.10.19 \
  v0.10.18 \
  v0.8.26  \
  v0.8.25  \
  v0.8.24  \
  v0.8.23  \
  v0.8.22  \
"
OUTPUT_PREFIX="nan-"
TEST_CMD="\
  cd /dnt/test/ &&                                               \
  npm install &&                                                 \
  node_modules/.bin/node-gyp --nodedir /usr/src/node/ rebuild && \
  node_modules/.bin/tap js/*-test.js;                            \
"
```

Next I configured **[LevelDOWN](https://github.com/rvagg/node-leveldown)** for **DNT**. The needs are much simpler, the tests need to do a compile and run a lot of node-tap tests.

**The LevelDOWN [.dntrc](https://raw.github.com/rvagg/node-leveldown/master/.dntrc)**

```sh
NODE_VERSIONS="\
  master   \
  v0.11.9  \
  v0.11.8  \
  v0.10.22 \
  v0.10.21 \
  v0.8.26  \
"
OUTPUT_PREFIX="leveldown-"
TEST_CMD="\
  cd /dnt/ &&                                                    \
  npm install &&                                                 \
  node_modules/.bin/node-gyp --nodedir /usr/src/node/ rebuild && \
  node_modules/.bin/tap test/*-test.js;                          \
"
```

Another native Node add-on that I've set up with **DNT** is my [libssh bindings](https://github.com/rvagg/node-libssh). This one is a little more complicated because you need to have some non-standard libraries installed before compile. My *.dntrc* adds some extra `apt-get` sauce to fetch and install those packages. It means the tests take a little longer but it's not prohibitive. An alternative would be to configure the *node_dev* base-image to have these packages to all of my versioned images have them too.

**The node-libssh [.dntrc](https://raw.github.com/rvagg/node-libssh/master/.dntrc)**

```sh
NODE_VERSIONS="master v0.11.9 v0.10.22"
OUTPUT_PREFIX="libssh-"
TEST_CMD="\
  apt-get install -y libkrb5-dev libssl-dev &&                           \
  cd /dnt/ &&                                                            \
  npm install &&                                                         \
  node_modules/.bin/node-gyp --nodedir /usr/src/node/ rebuild --debug && \
  node_modules/.bin/tap test/*-test.js --stderr;                         \
"
```

[LevelUP](https://github.com/rvagg/node-levelup) isn't a native add-on but it does use LevelDOWN which requires compiling. For the DNT config I'm removing *node_modules/leveldown/* prior to `npm install` so it gets rebuilt each time for each new version of Node.

**The [LevelUP .dntrc](https://raw.github.com/rvagg/node-levelup/master/.dntrc)**

```sh
NODE_VERSIONS="\
  master   \
  v0.11.9  \
  v0.11.8  \
  v0.10.22 \
  v0.10.21 \
  v0.8.26  \
"
OUTPUT_PREFIX="levelup-"
TEST_CMD="\
  cd /dnt/ &&                                                    \
  rm -rf node_modules/leveldown/ &&                              \
  npm install --nodedir=/usr/src/node &&                         \
  node_modules/.bin/tap test/*-test.js --stderr;                 \
#"
```

### What's next?

I have no idea but I'd love to have helpers flesh this out a little more. It's not hard to imagine this forming the basis of a local CI system as well as a general testing tool. The speed even makes it tempting to run the tests on every git commit, or perhaps on every save.

If you'd like to contribute to development then please submit a pull request, I'd be happy to discuss anything you might think would improve this project. I'm keen to share ownership with anyone making significant contributions; as I do with most of my open source projects.

See the **[DNT](https://github.com/rvagg/dnt)** GitHub repo for installation and detailed usage instructions.
