"use client"

// Organizo categorías y subcategorías: listar/filtrar y crear/editar/eliminar con imagen opcional

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Loader2, Puzzle } from "lucide-react"
import { categoryService, type Categoria, type Subcategoria } from "@/services/categoryService"
import { mediaService } from "@/services/mediaService"
import { useToast } from "@/components/ui/toastContext"

// Alterno entre crear y editar tanto para categoría como para subcategoría
type ModalModo = "crear" | "editar"

// Modelo de formulario para categoría (incluye imagen por URL)
interface CategoriaFormState {
  nombre: string
  descripcion: string
  imagenUrl: string
}

// Modelo de formulario para subcategoría
interface SubcategoriaFormState {
  nombre: string
  descripcion: string
}

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")

  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false)
  const [modoCategoria, setModoCategoria] = useState<ModalModo>("crear")
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [formCategoria, setFormCategoria] = useState<CategoriaFormState>({ nombre: "", descripcion: "", imagenUrl: "" })
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)

  const [modalSubcategoriaAbierto, setModalSubcategoriaAbierto] = useState(false)
  const [modoSubcategoria, setModoSubcategoria] = useState<ModalModo>("crear")
  const [categoriaPadre, setCategoriaPadre] = useState<Categoria | null>(null)
  const [subcategoriaEditando, setSubcategoriaEditando] = useState<Subcategoria | null>(null)
  const [formSubcategoria, setFormSubcategoria] = useState<SubcategoriaFormState>({ nombre: "", descripcion: "" })
  const [guardandoSubcategoria, setGuardandoSubcategoria] = useState(false)

  const { showToast } = useToast()

  // Al desmontar, libero cualquier blob de preview de imagen para evitar fugas
  useEffect(() => {
    return () => {
      if (imagenPreview && imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagenPreview)
      }
    }
  }, [imagenPreview])

  // Cargo categorías desde el backend y manejo estados
  const cargarCategorias = useCallback(async () => {
    setCargando(true)
    try {
      const data = await categoryService.listarCategorias()
      setCategorias(data)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar las categorías", "error")
    } finally {
      setCargando(false)
    }
  }, [showToast])

  useEffect(() => {
    void cargarCategorias()
  }, [cargarCategorias])

  // Filtro por texto tanto en categoría como en subcategorías
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((categoria) => {
      const termino = busqueda.toLowerCase()
      const coincideCategoria =
        categoria.nombre.toLowerCase().includes(termino) ||
        (categoria.descripcion ?? "").toLowerCase().includes(termino)

      const coincideSubcategoria = categoria.subcategorias.some((subcategoria) =>
        subcategoria.nombre.toLowerCase().includes(termino),
      )

      return coincideCategoria || coincideSubcategoria
    })
  }, [categorias, busqueda])

  // Preparo el formulario y la preview para crear/editar categoría
  const abrirModalCategoria = (modo: ModalModo, categoria?: Categoria) => {
    setModoCategoria(modo)
    setCategoriaEditando(categoria ?? null)
    setFormCategoria({
      nombre: categoria?.nombre ?? "",
      descripcion: categoria?.descripcion ?? "",
      imagenUrl: categoria?.imagenUrl ?? "",
    })
    setImagenArchivo(null)
    setImagenPreview(categoria?.imagenUrl ?? null)
    setModalCategoriaAbierto(true)
  }

  // Cierro el modal de categoría y limpio estado/preview
  const cerrarModalCategoria = () => {
    if (imagenPreview && imagenPreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagenPreview)
    }
    setModalCategoriaAbierto(false)
    setCategoriaEditando(null)
    setFormCategoria({ nombre: "", descripcion: "", imagenUrl: "" })
    setImagenArchivo(null)
    setImagenPreview(null)
  }

  // Valido, subo imagen si aplica y creo/actualizo la categoría
  const guardarCategoria = async () => {
    if (!formCategoria.nombre.trim()) {
      showToast("El nombre de la categoría es obligatorio", "error")
      return
    }

    let imagenUrl: string | null | undefined = formCategoria.imagenUrl.trim() || undefined

    if (imagenArchivo) {
      try {
        const subida = await mediaService.subirImagenCategoria(imagenArchivo)
        imagenUrl = subida.url
      } catch (error) {
        console.error(error)
        showToast("No fue posible subir la imagen de la categoría", "error")
        return
      }
    }

    setGuardandoCategoria(true)
    try {
      if (modoCategoria === "crear") {
        await categoryService.crearCategoria({
          nombre: formCategoria.nombre.trim(),
          descripcion: formCategoria.descripcion.trim() || undefined,
          imagenUrl: imagenUrl ?? null,
        })
        showToast("Categoría creada correctamente", "success")
      } else if (categoriaEditando) {
        await categoryService.actualizarCategoria(categoriaEditando.id, {
          nombre: formCategoria.nombre.trim(),
          descripcion: formCategoria.descripcion.trim() || undefined,
          imagenUrl:
            imagenUrl === ""
              ? null
              : imagenUrl !== undefined
                ? imagenUrl
                : undefined,
        })
        showToast("Categoría actualizada", "success")
      }
      cerrarModalCategoria()
      await cargarCategorias()
    } catch (error) {
      console.error(error)
      showToast("Ocurrió un error al guardar la categoría", "error")
    } finally {
      setGuardandoCategoria(false)
    }
  }

  // Confirmo y elimino categoría, luego recargo listado
  const eliminarCategoria = async (categoria: Categoria) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"? Se eliminarán también sus subcategorías.`,
    )
    if (!confirmar) return

    try {
      await categoryService.eliminarCategoria(categoria.id)
      showToast("Categoría eliminada", "success")
      await cargarCategorias()
    } catch (error) {
      console.error(error)
      showToast("No fue posible eliminar la categoría. Verifica que no tenga productos asociados.", "error")
    }
  }

  // Preparo datos base para crear/editar subcategoría bajo una categoría padre
  const abrirModalSubcategoria = (modo: ModalModo, categoria: Categoria, subcategoria?: Subcategoria) => {
    setModoSubcategoria(modo)
    setCategoriaPadre(categoria)
    setSubcategoriaEditando(subcategoria ?? null)
    setFormSubcategoria({
      nombre: subcategoria?.nombre ?? "",
      descripcion: subcategoria?.descripcion ?? "",
    })
    setModalSubcategoriaAbierto(true)
  }

  // Valido y creo/actualizo la subcategoría; refresco categorías al finalizar
  const guardarSubcategoria = async () => {
    if (!categoriaPadre) return
    if (!formSubcategoria.nombre.trim()) {
      showToast("El nombre de la subcategoría es obligatorio", "error")
      return
    }

    setGuardandoSubcategoria(true)
    try {
      if (modoSubcategoria === "crear") {
        await categoryService.crearSubcategoria({
          nombre: formSubcategoria.nombre.trim(),
          descripcion: formSubcategoria.descripcion.trim() || undefined,
          categoriaId: categoriaPadre.id,
        })
        showToast("Subcategoría creada correctamente", "success")
      } else if (subcategoriaEditando) {
        await categoryService.actualizarSubcategoria(subcategoriaEditando.id, {
          nombre: formSubcategoria.nombre.trim(),
          descripcion: formSubcategoria.descripcion.trim() || undefined,
          categoriaId: categoriaPadre.id,
        })
        showToast("Subcategoría actualizada", "success")
      }
      setModalSubcategoriaAbierto(false)
      await cargarCategorias()
    } catch (error) {
      console.error(error)
      showToast("Ocurrió un error al guardar la subcategoría", "error")
    } finally {
      setGuardandoSubcategoria(false)
    }
  }

  // Confirmo y elimino subcategoría; manejo errores comunes de integridad
  const eliminarSubcategoria = async (subcategoria: Subcategoria) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar la subcategoría "${subcategoria.nombre}"?`)
    if (!confirmar) return

    try {
      await categoryService.eliminarSubcategoria(subcategoria.id)
      showToast("Subcategoría eliminada", "success")
      await cargarCategorias()
    } catch (error) {
      console.error(error)
      showToast("No fue posible eliminar la subcategoría. Verifica que no tenga productos asociados.", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorías y Subcategorías</h1>
          <p className="text-muted-foreground">Organiza el catálogo de productos por categorías</p>
        </div>
        <Button onClick={() => abrirModalCategoria("crear")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoría o subcategoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Categorías
            <span className="ml-2 text-sm font-normal text-muted-foreground">({categoriasFiltradas.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Subcategorías</TableHead>
                    <TableHead className="w-36">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasFiltradas.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {categoria.descripcion || "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        <div className="w-20 h-16 bg-muted/60 rounded-md overflow-hidden">
                          <img
                            src={categoria.imagenUrl || "/categoria-placeholder.svg"}
                            alt={`Imagen de ${categoria.nombre}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {categoria.subcategorias.length === 0 && (
                            <span className="text-sm text-muted-foreground">Sin subcategorías</span>
                          )}
                          {categoria.subcategorias.map((subcategoria) => (
                            <Badge key={subcategoria.id} variant="secondary" className="flex items-center gap-1">
                              <Puzzle className="h-3 w-3" />
                              <span>{subcategoria.nombre}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => abrirModalSubcategoria("editar", categoria, subcategoria)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => void eliminarSubcategoria(subcategoria)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="link"
                          className="mt-2 h-auto p-0 text-primary"
                          onClick={() => abrirModalSubcategoria("crear", categoria)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Nueva subcategoría
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => abrirModalCategoria("editar", categoria)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void eliminarCategoria(categoria)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoriasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No se encontraron categorías que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalCategoriaAbierto}
        onOpenChange={(open) => {
          if (!open) {
            if (guardandoCategoria) return
            cerrarModalCategoria()
          } else {
            setModalCategoriaAbierto(true)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modoCategoria === "crear" ? "Nueva Categoría" : "Editar Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoria-nombre">Nombre</Label>
              <Input
                id="categoria-nombre"
                value={formCategoria.nombre}
                onChange={(e) => setFormCategoria((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="categoria-descripcion">Descripción</Label>
              <Textarea
                id="categoria-descripcion"
                rows={3}
                value={formCategoria.descripcion}
                onChange={(e) => setFormCategoria((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="categoria-imagen-url">URL de la imagen</Label>
              <Input
                id="categoria-imagen-url"
                value={formCategoria.imagenUrl}
                onChange={(e) => {
                  const valor = e.target.value
                  setFormCategoria((prev) => ({ ...prev, imagenUrl: valor }))
                  if (valor) {
                    setImagenArchivo(null)
                    if (imagenPreview && imagenPreview.startsWith("blob:")) {
                      URL.revokeObjectURL(imagenPreview)
                    }
                    setImagenPreview(valor)
                  } else {
                    if (imagenPreview && imagenPreview.startsWith("blob:")) {
                      URL.revokeObjectURL(imagenPreview)
                    }
                    setImagenPreview(null)
                  }
                }}
                placeholder="https://ejemplo.com/categoria.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria-imagen-archivo">Subir imagen desde tu equipo</Label>
              <Input
                id="categoria-imagen-archivo"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    if (imagenPreview && imagenPreview.startsWith("blob:")) {
                      URL.revokeObjectURL(imagenPreview)
                    }
                    setImagenArchivo(file)
                    setImagenPreview(URL.createObjectURL(file))
                    setFormCategoria((prev) => ({ ...prev, imagenUrl: "" }))
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Formatos permitidos: JPG, PNG, WebP. Tamaño máximo 5 MB.</p>
              <div className="w-full h-40 border rounded-md bg-muted/40 flex items-center justify-center overflow-hidden">
                {imagenPreview ? (
                  <img src={imagenPreview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">Sin imagen</span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cerrarModalCategoria} disabled={guardandoCategoria}>
                Cancelar
              </Button>
              <Button onClick={guardarCategoria} disabled={guardandoCategoria}>
                {guardandoCategoria ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalSubcategoriaAbierto} onOpenChange={setModalSubcategoriaAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modoSubcategoria === "crear" ? "Nueva Subcategoría" : "Editar Subcategoría"}
              {categoriaPadre && (
                <span className="block text-sm text-muted-foreground">
                  Categoría: <strong>{categoriaPadre.nombre}</strong>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcategoria-nombre">Nombre</Label>
              <Input
                id="subcategoria-nombre"
                value={formSubcategoria.nombre}
                onChange={(e) => setFormSubcategoria((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="subcategoria-descripcion">Descripción</Label>
              <Textarea
                id="subcategoria-descripcion"
                rows={3}
                value={formSubcategoria.descripcion}
                onChange={(e) => setFormSubcategoria((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalSubcategoriaAbierto(false)} disabled={guardandoSubcategoria}>
                Cancelar
              </Button>
              <Button onClick={guardarSubcategoria} disabled={guardandoSubcategoria}>
                {guardandoSubcategoria ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
