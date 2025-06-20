"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useDevice } from "@/hooks/use-device"
import { useAuthStore } from "@/lib/auth"
import MobileLayout from "@/components/layouts/mobile-layout"
import DesktopLayout from "@/components/layouts/desktop-layout"
import VigilanteLayout from "@/components/layouts/vigilante-layout"
import MainLayout from "@/components/layouts/main-layout" // Import MainLayout

interface RootLayoutClientProps {
  children: ReactNode
}

// Asegurar que el contenedor raíz ocupe todo el ancho disponible
export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const { isMobile, isTablet } = useDevice()
  const pathname = usePathname()
  const { isAdmin, isVigilante, isAuxiliar } = useAuthStore()

  // Special case for vigilante pages
  if (isVigilante || pathname.startsWith("/vigilante")) {
    return <VigilanteLayout>{children}</VigilanteLayout>
  }

  // Special case for auxiliar pages
  if (isAuxiliar || pathname.startsWith("/auxiliar")) {
    return <MobileLayout>{children}</MobileLayout>
  }

  // For admin pages on desktop, use desktop layout
  if (isAdmin && pathname.startsWith("/admin") && !isMobile && !isTablet) {
    return <DesktopLayout>{children}</DesktopLayout>
  }

  // For mobile devices or non-admin pages
  if (isMobile || isTablet) {
    return <MobileLayout>{children}</MobileLayout>
  }

  // Default desktop layout for other cases
  // Reemplazar la lógica condicional que decide qué layout mostrar
  // De algo como:
  // {isAuthenticated ? <MainLayout>{children}</MainLayout> : <LoginLayout>{children}</LoginLayout>}
  // A:
  return <MainLayout>{children}</MainLayout>
}
