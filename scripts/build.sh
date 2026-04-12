#!/bin/bash
set -e
npm run build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
