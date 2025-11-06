#!/bin/sh
set -eu

# Este script arranca el backend sin depender de npm en tiempo de ejecución.
# Ajusto PATH para que incluya rutas típicas de Nixpacks, Node instalados vía Nix y el runtime preparado en build.
export PATH="$PATH:/usr/local/bin:/nix/var/nix/profiles/default/bin:/nix/profile/bin:/app/node_modules/.bin"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$SCRIPT_DIR/backend"
NODE_VERSION="${NODE_VERSION:-20.18.1}"

detect_node_dist() {
	ARCH=$(uname -m)
	case "$ARCH" in
		x86_64|amd64)
			printf '%s' "linux-x64"
			;;
		aarch64|arm64)
			printf '%s' "linux-arm64"
			;;
		*)
			echo "Arquitectura no soportada para instalar Node automáticamente: $ARCH" >&2
			return 1
			;;
	esac
}

NODE_DIST=$(detect_node_dist)
NODE_RUNTIME_DIR="$BACKEND_DIR/node-runtime/node-v${NODE_VERSION}-${NODE_DIST}"
NODE_MODULE_NODE="$BACKEND_DIR/node_modules/node/bin/node"

if [ -d "$NODE_RUNTIME_DIR/bin" ]; then
	export PATH="$NODE_RUNTIME_DIR/bin:$PATH"
fi

if [ -x "$NODE_MODULE_NODE" ]; then
	export PATH="$(dirname "$NODE_MODULE_NODE"):$PATH"
fi

download_node_if_missing() {
	if command -v node >/dev/null 2>&1; then
		return 0
	fi

	TMP_DIR="/tmp/node-runtime"
	mkdir -p "$TMP_DIR"
	ARCHIVE="node-v${NODE_VERSION}-${NODE_DIST}.tar.gz"
	TARGET_DIR="$NODE_RUNTIME_DIR"

	if [ ! -d "$TARGET_DIR/bin" ]; then
		echo "Descargando Node.js $NODE_VERSION para $NODE_DIST..."
		if command -v curl >/dev/null 2>&1; then
			curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${ARCHIVE}" -o "$TMP_DIR/${ARCHIVE}"
		elif command -v wget >/dev/null 2>&1; then
			wget -qO "$TMP_DIR/${ARCHIVE}" "https://nodejs.org/dist/v${NODE_VERSION}/${ARCHIVE}"
		else
			echo "No se pudo descargar Node.js: curl y wget no están disponibles." >&2
			return 1
		fi
		tar -xf "$TMP_DIR/${ARCHIVE}" -C "$TMP_DIR"
		mkdir -p "$(dirname "$NODE_RUNTIME_DIR")"
		mv "$TMP_DIR/node-v${NODE_VERSION}-${NODE_DIST}" "$NODE_RUNTIME_DIR"
	fi

	export PATH="$TARGET_DIR/bin:$PATH"
}

download_node_if_missing || true

# Usa `node build/main.js` si `node` está disponible; si no, intenta `npm run start:prod`.
cd "$BACKEND_DIR"

if command -v node >/dev/null 2>&1; then
	exec node build/main.js
fi

for candidate in \
	"$NODE_RUNTIME_DIR"/bin/node \
	"$NODE_MODULE_NODE" \
	/usr/local/bin/node \
	/usr/bin/node \
	/nix/var/nix/profiles/default/bin/node \
	/nix/profile/bin/node \
	/tmp/node-runtime/node-v*/bin/node \
	/nix/store/*node*/bin/node; do
	[ -x "$candidate" ] || continue
	exec "$candidate" build/main.js
done

if command -v npm >/dev/null 2>&1; then
	exec npm run start:prod
fi

echo "Error: ni node ni npm están disponibles en el contenedor." >&2
exit 1
