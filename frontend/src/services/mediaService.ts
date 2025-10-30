import { api } from "./api"

interface UploadResponse {
  url: string
  path: string
  nombre: string
  tamaño: number
}

// Subo una imagen de producto usando FormData y devuelvo la ubicación
async function subirImagenProducto(archivo: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("archivo", archivo)

  const { data } = await api.post<UploadResponse>("/media/productos", formData)

  return data
}

// Subo una imagen asociada a una categoría
async function subirImagenCategoria(archivo: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("archivo", archivo)

  const { data } = await api.post<UploadResponse>("/media/categorias", formData)

  return data
}

export const mediaService = {
  subirImagenProducto,
  subirImagenCategoria,
}
