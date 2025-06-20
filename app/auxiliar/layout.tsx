"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { CheckSquare, LogOut, User, Plus, ClipboardList, Building2 } from "lucide-react"
import NewReportModal from "@/components/auxiliar/new-report-modal"

export default function AuxiliarLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMantenimiento, logout, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isMantenimiento) {
      router.push("/home")
    }
  }, [isAuthenticated, isMantenimiento, router])

  // No mostrar el layout de auxiliar para páginas que no son de auxiliar
  if (!pathname.startsWith("/auxiliar")) {
    return <div className="min-h-screen">{children}</div>
  }

  if (!isAuthenticated || !isMantenimiento) {
    return null
  }

  const handleNewActivity = () => {
    setIsNewReportModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header con título */}
      <header className="bg-[#0e2c52] text-white py-3 px-4">
        <h1 className="text-xl font-bold">Panel Mantenimiento</h1>
      </header>

      {/* Navbar superior */}
      <nav className="bg-[#0e2c52] text-white border-t border-[#1a4580] shadow-md sticky top-0 z-30 hidden md:block">
        <div className="flex flex-wrap">
          <Link
            href="/auxiliar/reportes"
            className={`flex items-center py-3 px-4 ${
              pathname === "/auxiliar/reportes"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <ClipboardList className="mr-2 h-5 w-5" />
            <span>Mis Actividades</span>
          </Link>
          <Link
            href="/auxiliar/reportes-condominio"
            className={`flex items-center py-3 px-4 ${
              pathname === "/auxiliar/reportes-condominio"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <Building2 className="mr-2 h-5 w-5" />
            <span>Condominios</span>
          </Link>
          <Link
            href="/auxiliar"
            className={`flex items-center py-3 px-4 ${
              pathname === "/auxiliar" ? "bg-[#1a4580] text-white" : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <CheckSquare className="mr-2 h-5 w-5" />
            <span>Mis Tareas</span>
          </Link>
          <Link
            href="/auxiliar/perfil"
            className={`flex items-center py-3 px-4 ${
              pathname === "/auxiliar/perfil"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <User className="mr-2 h-5 w-5" />
            <span>Mi Perfil</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center py-3 px-4 ml-auto text-gray-300 hover:bg-[#1a4580] hover:text-white transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Contenido principal - ahora ocupa todo el ancho */}
      <main className="flex-1 p-6 pb-16 md:pb-6">{children}</main>

      {/* Barra de navegación inferior para móviles - Diseño estilizado */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-3">
        <div className="relative flex items-center justify-between bg-gray-200 rounded-full px-8 py-2 shadow-lg">
          {/* Botón Actividades (antes Tareas) */}
          <Link
            href="/auxiliar/reportes-condominio"
            className={`flex flex-col items-center ${pathname === "/auxiliar/reportes-condominio" ? "text-[#0e2c52] font-medium" : "text-gray-600"}`}
          >
            <ClipboardList className="h-6 w-6" />
            <span className="text-xs mt-1">Condominios</span>
          </Link>

          {/* Espacio para el botón central */}
          <div className="w-16"></div>

          {/* Botón de cerrar sesión */}
          <button onClick={logout} className="flex flex-col items-center text-gray-600">
            <LogOut className="h-6 w-6" />
            <span className="text-xs mt-1">Salir</span>
          </button>

          {/* Botón central con signo + (ahora abre el modal de nueva actividad) */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/3">
            <button
              onClick={handleNewActivity}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-black text-white shadow-lg"
            >
              <Plus className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal para nueva actividad */}
      <NewReportModal isOpen={isNewReportModalOpen} onClose={() => setIsNewReportModalOpen(false)} />
    </div>
  )
}
