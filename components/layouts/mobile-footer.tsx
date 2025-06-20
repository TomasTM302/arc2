"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, MoreHorizontal } from "lucide-react"
import { useAuthStore } from "@/lib/auth"

export default function MobileFooter() {
  const pathname = usePathname()
  const { isAuxiliar, isAdmin, isVigilante } = useAuthStore()
  const isMaintenancePage = pathname.includes("/mantenimiento") || pathname.includes("/auxiliar")

  // Don't show footer for special roles
  if (isAuxiliar || isMaintenancePage || isAdmin || isVigilante) return null

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#D4AF37] border-t border-[#c9a633] py-2 px-4 z-10">
      <div className="flex justify-around items-center">
        <Link href="/home" className={`flex flex-col items-center ${pathname === "/home" ? "text-white" : "text-[#0e2c52]"}`}>
          <Home size={24} />
          <span className="text-xs font-medium mt-1">Inicio</span>
        </Link>

        <Link
          href="/more"
          className={`flex flex-col items-center ${pathname === "/more" ? "text-white" : "text-[#0e2c52]"}`}
        >
          <MoreHorizontal size={24} />
          <span className="text-xs font-medium mt-1">Más</span>
        </Link>

        <Link
          href="/invitados"
          className={`flex flex-col items-center ${pathname.startsWith("/invitados") ? "text-white" : "text-[#0e2c52]"}`}
        >
          <User size={24} />
          <span className="text-xs font-medium mt-1">Invitados</span>
        </Link>
      </div>
    </footer>
  )
}
