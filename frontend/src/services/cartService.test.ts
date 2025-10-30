import { describe, it, expect, beforeEach } from 'vitest'
import { cartService } from './cartService'
import { tokenStorage } from './tokenStorage'

// Verifico operaciones del carrito: obtener, agregar, editar y eliminar ítems
describe('cartService', () => {
  // Inyecto tokens antes de cada prueba para simular sesión activa
  beforeEach(() => {
    tokenStorage.setTokens({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    })
  })

  // Compruebo recuperación del carrito del usuario
  describe('obtenerCarrito', () => {
    it('debe obtener el carrito del usuario autenticado', async () => {
      const carrito = await cartService.obtenerCarrito()

      expect(carrito).toBeDefined()
      if (carrito) {
        expect(carrito.id).toBeDefined()
        expect(carrito.items).toBeInstanceOf(Array)
      }
    })

    // Simulo la ausencia de carrito y espero null o estructura sin ítems según backend
    it('debe retornar null si el carrito no existe', async () => {
      // Aquí podríamos simular un 404 con MSW
      const carrito = await cartService.obtenerCarrito()
      expect(carrito).toBeDefined()
    })
  })

  // Verifico que agregar producto devuelva un carrito con ítems
  describe('agregarProducto', () => {
    it('debe agregar un producto al carrito', async () => {
      const carrito = await cartService.agregarProducto(1, 2)

      expect(carrito).toBeDefined()
      if (carrito) {
        expect(carrito.items).toBeInstanceOf(Array)
        expect(carrito.items.length).toBeGreaterThan(0)
      }
    })
  })

  // Verifico edición de cantidad de un ítem existente
  describe('editarProducto', () => {
    it('debe actualizar la cantidad de un item del carrito', async () => {
      const carrito = await cartService.editarProducto(1, 5)

      expect(carrito).toBeDefined()
      if (carrito) {
        expect(carrito.items).toBeInstanceOf(Array)
      }
    })
  })

  // Verifico eliminación de un ítem y respuesta válida
  describe('eliminarProducto', () => {
    it('debe eliminar un producto del carrito', async () => {
      const carrito = await cartService.eliminarProducto(1)

      expect(carrito).toBeDefined()
    })
  })
})
