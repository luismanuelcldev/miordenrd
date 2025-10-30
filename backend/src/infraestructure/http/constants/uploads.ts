// Aquí he definido las rutas base de carga de archivos, permitiendo sobreescribir el directorio vía variable de entorno.
import { join } from 'path';
import { tmpdir } from 'os';

const baseDir = process.env.UPLOADS_DIR ?? join(tmpdir(), 'sistemapedidos');

// Aquí he expuesto el directorio raíz donde almaceno archivos subidos temporal o persistentemente.
export const UPLOADS_ROOT = baseDir;
// Aquí he organizado la carpeta donde guardo imágenes de productos.
export const PRODUCTS_UPLOAD_DIR = join(baseDir, 'products');
// Aquí he organizado la carpeta donde guardo imágenes de categorías.
export const CATEGORIES_UPLOAD_DIR = join(baseDir, 'categories');
