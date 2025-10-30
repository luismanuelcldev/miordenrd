import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Levanto un servidor MSW para pruebas en Node (Jest/Vitest)
export const server = setupServer(...handlers)
