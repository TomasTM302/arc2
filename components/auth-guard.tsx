"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

type UserRole = string

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireVigilante?: boolean
  requireMantenimiento?: boolean
  requireRole?: UserRole
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireVigilante = false,
  requireMantenimiento = false,
  requireRole,
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, isVigilante, isMantenimiento, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    // Siempre permitir acceso a la página de vigilante sin autenticación
    if (pathname.startsWith("/vigilante")) {
      setIsAuthorized(true)
      return
    }

    // Si authentication es requerida y el usuario no está autenticado
    if (requireAuth && !isAuthenticated) {
      // No redirigir a login si estamos intentando acceder a /vigilante
      if (!pathname.startsWith("/vigilante")) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }
    }

    // Si se requieren privilegios de admin y el usuario no es admin
    if (requireAdmin && !isAdmin) {
      router.push("/")
      return
    }

    // Si se requieren privilegios de vigilante y el usuario no es vigilante
    if (requireVigilante && !isVigilante && !pathname.startsWith("/vigilante")) {
      router.push("/")
      return
    }

    // Si se requieren privilegios de mantenimiento y el usuario no es mantenimiento
    if (requireMantenimiento && !isMantenimiento) {
      router.push("/")
      return
    }

    // Si se requiere un rol específico y el usuario no tiene ese rol
    if (requireRole && user?.role !== requireRole) {
      router.push("/")
      return
    }

    setIsAuthorized(true)
  }, [
    isAuthenticated,
    isAdmin,
    isVigilante,
    isMantenimiento,
    requireAuth,
    requireAdmin,
    requireVigilante,
    requireMantenimiento,
    requireRole,
    router,
    pathname,
    user?.role,
  ])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
