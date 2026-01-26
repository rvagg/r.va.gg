#!/usr/bin/env node

import Blorg, { archetypes } from 'blorg'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config = archetypes.blog({
  outputRoot: './master/'
})

const blorg = new Blorg(__dirname, config)
await blorg.run()

console.log('Build complete!')
