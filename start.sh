#!/bin/sh
set -eu

cd "$(dirname "$0")/backend"

npm run start:prod
