#!/bin/sh
set -eu

# Este script arranca el backend sin depender de npm en tiempo de ejecución.
# Usa `node build/main.js` si `node` está disponible; si no, intenta `npm run start:prod`.
cd "$(dirname "$0")/backend"

if command -v node >/dev/null 2>&1; then
	exec node build/main.js
elif command -v npm >/dev/null 2>&1; then
	exec npm run start:prod
else
	echo "Error: ni node ni npm están disponibles en el contenedor." >&2
	exit 1
fi
