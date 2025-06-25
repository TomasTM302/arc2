"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

// Lista de rutas públicas que no requieren autenticación
const PUBLIC_PATHS = ["/", "/login", "/register"]

export default function AuthRedirect() {
  const { isAuthenticated, isVigilante, isMantenimiento } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // COMENTADO: Ya no redirigimos a login si no está autenticado
    // if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
    //   router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    //   return
    // }

    // Si el usuario está autenticado como vigilante y no está en el dashboard de vigilante, redirigir allí
    if (isAuthenticated && isVigilante && pathname !== "/vigilante" && !pathname.startsWith("/vigilante/")) {
      router.push("/vigilante")
      return
    }

    // Si el usuario está autenticado como mantenimiento y no está en su dashboard, redirigir allí
    if (isAuthenticated && isMantenimiento && pathname !== "/mantenimiento" && !pathname.startsWith("/mantenimiento/")) {
      router.push("/mantenimiento")
      return
    }

    // Si el usuario está autenticado como residente o admin e intenta acceder a páginas de vigilante, redirigir a home
    if (isAuthenticated && !isVigilante && (pathname === "/vigilante" || pathname.startsWith("/vigilante/"))) {
      router.push("/home")
      return
    }

    // Si el usuario está autenticado como residente o admin e intenta acceder a páginas de auxiliar/mantenimiento, redirigir a home
    if (isAuthenticated && !isMantenimiento && (pathname === "/mantenimiento" || pathname.startsWith("/mantenimiento/"))) {
      router.push("/home")
      return
    }
  }, [isAuthenticated, isVigilante, isMantenimiento, pathname, router])

  return null
}
