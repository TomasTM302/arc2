import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "admin" | "resident" | "vigilante" | "mantenimiento"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  house: string
  role: UserRole
  createdAt: string
}

interface Credentials {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isVigilante: boolean
  isMantenimiento: boolean
  rememberMe: boolean
  login: (credentials: Credentials) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  setRememberMe: (value: boolean) => void
  resetStore: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isVigilante: false,
      isMantenimiento: false,
      rememberMe: false,

      login: async (credentials) => {
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })

          const data = await res.json()
          if (!res.ok || !data.success) {
            return { success: false, message: data.message || 'Credenciales incorrectas' }
          }

          const { user, token } = data
          set({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isVigilante: user.role === 'vigilante',
            isMantenimiento: user.role === 'mantenimiento',
          })

          return { success: true }
        } catch (err) {
          console.error(err)
          return { success: false, message: 'Error de servidor' }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isVigilante: false,
          isMantenimiento: false,
        })
      },

      setRememberMe: (value: boolean) => {
        set({ rememberMe: value })
      },

      resetStore: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isVigilante: false,
          isMantenimiento: false,
          rememberMe: false,
        })
      },
    }),
    {
      name: "arcos-auth-storage",
      partialize: (state) =>
        state.rememberMe
          ? {
              user: state.user,
              token: state.token,
              isAuthenticated: state.isAuthenticated,
              isAdmin: state.isAdmin,
              isVigilante: state.isVigilante,
              isMantenimiento: state.isMantenimiento,
              rememberMe: state.rememberMe,
            }
          : { rememberMe: state.rememberMe },
    },
  ),
)
