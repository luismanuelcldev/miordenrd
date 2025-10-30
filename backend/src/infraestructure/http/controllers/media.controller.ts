import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync, chmodSync } from 'fs';
import type { Request } from 'express';
import {
  CATEGORIES_UPLOAD_DIR,
  PRODUCTS_UPLOAD_DIR,
  UPLOADS_ROOT,
} from '../constants/uploads';

interface UploadedImageFile {
  filename: string;
  originalname: string;
  size: number;
  mimetype?: string;
}

function ensureDirectories() {
  if (!existsSync(UPLOADS_ROOT)) {
    mkdirSync(UPLOADS_ROOT, { recursive: true, mode: 0o775 });
  }
  for (const dir of [PRODUCTS_UPLOAD_DIR, CATEGORIES_UPLOAD_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o775 });
    }
  }
  try {
    chmodSync(UPLOADS_ROOT, 0o775);
    chmodSync(PRODUCTS_UPLOAD_DIR, 0o775);
    chmodSync(CATEGORIES_UPLOAD_DIR, 0o775);
  } catch (error) {
    void error;
  }
}

ensureDirectories();

@Controller('media')
export class MediaController {
  // Aquí he permitido cargar imágenes de productos almacenándolas en disco y devolviendo la URL pública.
  @Post('productos')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureDirectories();
          cb(null, PRODUCTS_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Solo se permiten archivos de imagen'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  cargarImagenProducto(
    @UploadedFile() archivo: UploadedImageFile,
    @Req() req: Request,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/products/${archivo.filename}`;

    return {
      url: `${baseUrl}${relativePath}`,
      path: relativePath,
      nombre: archivo.originalname,
      tamaño: archivo.size,
    };
  }

  // Aquí he permitido cargar imágenes de categorías reutilizando la misma estrategia de almacenamiento.
  @Post('categorias')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureDirectories();
          cb(null, CATEGORIES_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Solo se permiten archivos de imagen'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  cargarImagenCategoria(
    @UploadedFile() archivo: UploadedImageFile,
    @Req() req: Request,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/categories/${archivo.filename}`;

    return {
      url: `${baseUrl}${relativePath}`,
      path: relativePath,
      nombre: archivo.originalname,
      tamaño: archivo.size,
    };
  }
}
