#!/bin/sh
set -eu

cd "$(dirname "$0")/backend"

npm ci
npx prisma generate
npm run build
npm prune --omit=dev
