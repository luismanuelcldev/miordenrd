import { api } from "./api"

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string | null
  imagenUrl?: string | null
  subcategorias: Subcategoria[]
}

export interface Subcategoria {
  id: number
  nombre: string
  descripcion?: string | null
  categoriaId: number
}

export interface GuardarCategoriaPayload {
  nombre: string
  descripcion?: string
  imagenUrl?: string | null
}

export interface GuardarSubcategoriaPayload {
  nombre: string
  descripcion?: string
  categoriaId: number
}

// Listo todas las categorías con sus subcategorías
async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>("/categorias")
  return data
}

// Creo una categoría y devuelvo la entidad persistida
async function crearCategoria(payload: GuardarCategoriaPayload): Promise<Categoria> {
  const { data } = await api.post<Categoria>("/categorias", payload)
  return data
}

// Actualizo los campos de una categoría por id
async function actualizarCategoria(id: number, payload: Partial<GuardarCategoriaPayload>): Promise<Categoria> {
  const { data } = await api.patch<Categoria>(`/categorias/${id}`, payload)
  return data
}

// Elimino una categoría por id
async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}

// Creo una subcategoría asociada a una categoría existente
async function crearSubcategoria(payload: GuardarSubcategoriaPayload): Promise<Subcategoria> {
  const { data } = await api.post<Subcategoria>(`/categorias/${payload.categoriaId}/subcategorias`, payload)
  return data
}

// Actualizo una subcategoría por id
async function actualizarSubcategoria(id: number, payload: Partial<GuardarSubcategoriaPayload>): Promise<Subcategoria> {
  const { data } = await api.patch<Subcategoria>(`/categorias/subcategorias/${id}`, payload)
  return data
}

// Elimino una subcategoría por id
async function eliminarSubcategoria(id: number): Promise<void> {
  await api.delete(`/categorias/subcategorias/${id}`)
}

export const categoryService = {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
}
