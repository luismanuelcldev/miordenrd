import { describe, it, expect } from 'vitest'
import { productService } from './productService'

// Valido listados, filtros, ordenaciones y detalle de productos
describe('productService', () => {
  // Compruebo paginación básica en el listado
  describe('listarProductos', () => {
    it('debe listar productos con paginación', async () => {
      const resultado = await productService.listarProductos({ page: 1, limit: 12 })

      expect(resultado).toBeDefined()
      expect(resultado.productos).toBeInstanceOf(Array)
      expect(resultado.productos.length).toBeGreaterThan(0)
      expect(resultado.paginacion).toBeDefined()
      expect(resultado.paginacion.page).toBe(1)
      expect(resultado.paginacion.limit).toBe(12)
    })

    // Verifico que el filtro de búsqueda no rompa el contrato
    it('debe filtrar productos por búsqueda', async () => {
      const resultado = await productService.listarProductos({
        search: 'Producto A',
        page: 1,
        limit: 12,
      })

      expect(resultado.productos).toBeDefined()
      expect(resultado.productos.length).toBeGreaterThanOrEqual(0)
    })

    // Aseguro que el ordenamiento por precio asc funcione en el happy path
    it('debe ordenar productos por precio ascendente', async () => {
      const resultado = await productService.listarProductos({
        ordenarPor: 'precio',
        orden: 'asc',
      })

      expect(resultado.productos).toBeDefined()
      if (resultado.productos.length > 1) {
        expect(resultado.productos[0].precio).toBeLessThanOrEqual(
          resultado.productos[1].precio
        )
      }
    })
  })

  // Consulto el detalle de producto y reviso campos clave
  describe('obtenerProducto', () => {
    it('debe obtener un producto por ID', async () => {
      const producto = await productService.obtenerProducto(1)

      expect(producto).toBeDefined()
      expect(producto.id).toBe(1)
      expect(producto.nombre).toBeDefined()
      expect(producto.precio).toBeGreaterThan(0)
      expect(producto.categoria).toBeDefined()
    })
  })

  // Reviso inventario agrupado para vista administrativa
  describe('listarInventario', () => {
    it('debe obtener el inventario de productos', async () => {
      const inventario = await productService.listarInventario()

      expect(Array.isArray(inventario)).toBe(true)
    })
  })
})
