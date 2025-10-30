import { describe, it, expect, beforeEach } from 'vitest'
import { authService } from './authService'
import { tokenStorage } from './tokenStorage'

// Verifico el flujo de autenticación: login, registro, perfil y logout
describe('authService', () => {
  // Limpio tokens antes de cada prueba para aislar el estado
  beforeEach(() => {
    tokenStorage.clearTokens()
  })

  // Compruebo que el login guarda tokens y normaliza el usuario
  describe('login', () => {
    it('debe iniciar sesión correctamente y guardar tokens', async () => {
      const usuario = await authService.login({
        email: 'test@acme.com',
        contrasena: 'password123',
      })

      expect(usuario).toBeDefined()
      expect(usuario.email).toBe('test@acme.com')
      expect(usuario.nombre).toBe('Test')
      expect(tokenStorage.getAccessToken()).toBe('mock-access-token')
      expect(tokenStorage.getRefreshToken()).toBe('mock-refresh-token')
    })
  })

  // Verifico que el registro cree sesión y devuelva el usuario
  describe('register', () => {
    it('debe registrar un nuevo usuario correctamente', async () => {
      const usuario = await authService.register({
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@acme.com',
        contrasena: 'password123',
      })

      expect(usuario).toBeDefined()
      expect(usuario.email).toBe('nuevo@acme.com')
      expect(tokenStorage.getAccessToken()).toBe('mock-access-token')
    })
  })

  // Confirmo que puedo obtener el perfil autenticado
  describe('getProfile', () => {
    it('debe obtener el perfil del usuario autenticado', async () => {
      tokenStorage.setTokens({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      })

      const perfil = await authService.getProfile()

      expect(perfil).toBeDefined()
      expect(perfil.email).toBe('test@acme.com')
      expect(perfil.nombre).toBe('Test')
    })
  })

  // Aseguro que el logout limpie los tokens incluso si el endpoint falla
  describe('logout', () => {
    it('debe cerrar sesión y limpiar tokens', async () => {
      tokenStorage.setTokens({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      })

      await authService.logout()

      expect(tokenStorage.getAccessToken()).toBeNull()
      expect(tokenStorage.getRefreshToken()).toBeNull()
    })
  })
})
