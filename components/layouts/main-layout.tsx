"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-[#0e2c52] w-full overflow-x-hidden">
      <main className="flex-grow w-full">
        <div className="w-full">{children}</div>
      </main>
    </div>
  )
}
