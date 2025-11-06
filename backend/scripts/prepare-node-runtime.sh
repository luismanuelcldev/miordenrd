#!/bin/sh
set -eu

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
		echo "Arquitectura no soportada para preparar Node automáticamente: $ARCH" >&2
		exit 1
		;;
 esac

RUNTIME_DIR="node-runtime/node-v${NODE_VERSION}-${NODE_DIST}"
if [ -d "$RUNTIME_DIR/bin" ]; then
	echo "Node runtime ya existe en $RUNTIME_DIR"
	exit 0
fi

echo "Preparando Node.js $NODE_VERSION ($NODE_DIST) para tiempo de ejecución..."
TMP_DIR=$(mktemp -d)
cleanup() {
	rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT HUP TERM

ARCHIVE="node-v${NODE_VERSION}-${NODE_DIST}.tar.gz"
URL="https://nodejs.org/dist/v${NODE_VERSION}/${ARCHIVE}"

if command -v curl >/dev/null 2>&1; then
	curl -fsSL "$URL" -o "$TMP_DIR/$ARCHIVE"
elif command -v wget >/dev/null 2>&1; then
	wget -qO "$TMP_DIR/$ARCHIVE" "$URL"
else
	echo "No se pudo descargar Node.js: curl y wget no están disponibles en build." >&2
	exit 1
fi

tar -xf "$TMP_DIR/$ARCHIVE" -C "$TMP_DIR"
mkdir -p "node-runtime"
mv "$TMP_DIR/node-v${NODE_VERSION}-${NODE_DIST}" "$RUNTIME_DIR"
chmod -R u+rwX,go+rX "$RUNTIME_DIR"

echo "Node runtime preparado en $RUNTIME_DIR"
