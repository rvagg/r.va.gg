#!/usr/bin/env node

const blorg = require('blorg')

blorg(__dirname, blorg.archetypes.blog({
    outputRoot: './master/'
}))