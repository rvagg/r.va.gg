#!/usr/bin/env node

const blorg = require('blorg')
    , fs    = require('fs')
    , path  = require('path')

function build () {
  console.log('Building...')
  blorg(__dirname, blorg.archetypes.presentation({
      files  : { root: './index.md' }
    , output : '../index.html'
  }))
}

build()

if (process.argv[2] == '--watch')
  fs.watchFile(path.join(__dirname, './index.md'), { interval: 500 }, build)
