#!/bin/sh
set -eu

# Este script arranca el backend sin depender de npm en tiempo de ejecución.
# Ajusto PATH para que incluya rutas típicas de Nixpacks y Node instalados vía Nix.
export PATH="$PATH:/usr/local/bin:/nix/var/nix/profiles/default/bin:/nix/profile/bin:/app/node_modules/.bin"

download_node_if_missing() {
	if command -v node >/dev/null 2>&1; then
		return 0
	fi

	NODE_VERSION="${NODE_VERSION:-20.18.1}"
	ARCH=$(uname -m)
	case "$ARCH" in
		x86_64|amd64)
			NODE_DIST="linux-x64"
			;;
		aarch64|arm64)
			NODE_DIST="linux-arm64"
			;;
		*)
			echo "Arquitectura no soportada para instalar Node automáticamente: $ARCH" >&2
			return 1
			;;
	esac

	TMP_DIR="/tmp/node-runtime"
	mkdir -p "$TMP_DIR"
	ARCHIVE="node-v${NODE_VERSION}-${NODE_DIST}.tar.gz"
	TARGET_DIR="$TMP_DIR/node-v${NODE_VERSION}-${NODE_DIST}"

	if [ ! -d "$TARGET_DIR" ]; then
		echo "Descargando Node.js $NODE_VERSION para $NODE_DIST..."
		curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${ARCHIVE}" -o "$TMP_DIR/${ARCHIVE}"
		tar -xf "$TMP_DIR/${ARCHIVE}" -C "$TMP_DIR"
	fi

	export PATH="$TARGET_DIR/bin:$PATH"
}

download_node_if_missing || true

# Usa `node build/main.js` si `node` está disponible; si no, intenta `npm run start:prod`.
cd "$(dirname "$0")/backend"

if command -v node >/dev/null 2>&1; then
	exec node build/main.js
fi

for candidate in \
	"/usr/local/bin/node" \
	"/usr/bin/node" \
	"/nix/var/nix/profiles/default/bin/node" \
	"/nix/profile/bin/node" \
	"/tmp/node-runtime"/node-v*/bin/node; do
	if [ -x "$candidate" ]; then
		exec "$candidate" "build/main.js"
	fi
done

if command -v npm >/dev/null 2>&1; then
	exec npm run start:prod
fi

echo "Error: ni node ni npm están disponibles en el contenedor." >&2
exit 1
