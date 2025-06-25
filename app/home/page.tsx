"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import ServiceCard from "@/components/service-card"
import Footer from "@/components/footer"
import { useAuthStore } from "@/lib/auth"
import Link from "next/link"
import AuthGuard from "@/components/auth-guard"
import { useSecurityStore } from "@/lib/security-store"
import { QrCode } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { isAuthenticated, isAdmin, isVigilante, isMantenimiento, user, logout } = useAuthStore()
  const { createSecurityAlert } = useSecurityStore()
  const router = useRouter()

  // Redirigir vigilantes y personal de mantenimiento a sus respectivos dashboards
  if (isVigilante) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e2c52]">
        <p className="text-white">Redirigiendo al panel de vigilancia...</p>
      </div>
    )
  }

  if (isMantenimiento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e2c52]">
        <p className="text-white">Redirigiendo al panel de mantenimiento...</p>
      </div>
    )
  }

  // Definir los servicios para poder manejarlos más fácilmente
  const services = [
    { image: "/images/pago-mantenimiento.png", href: "/pago-mantenimiento" },
    { image: "/images/invitados.png", href: "/invitados" },
    { image: "/images/mascota-extraviada.png", href: "/mascotas" },
    { image: "/images/comercios-cercanos.png", href: "/comercios" },
    { image: "/images/transparencia.png", href: "/transparencia" },
    { image: "/images/reserva-areas-comunes.jpg", href: "/reserva-areas" },
    { image: "/images/avisos.jpg", href: "/avisos" },
  ]

  // Verificar si el último elemento está solo en su fila
  const isLastItemAlone = services.length % 2 !== 0

  // Add a check for isRegularResident similar to the one in more/page.tsx
  const isRegularResident = !isAdmin && !isVigilante && !isMantenimiento

  // Función para manejar el clic en el botón de leer QR
  const handleQrButtonClick = () => {
    router.push("/vigilante")
  }

  return (
    <AuthGuard requireAuth={false}>
      <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
        <header className="container mx-auto flex items-center justify-between py-4 px-4 max-w-7xl">
          <div className="w-16 h-16">
            <Image src="/images/arcos-logo.png" alt="ARCOS Logo" width={64} height={64} className="object-contain" />
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">
                  Hola, {user?.firstName} {user?.role === "admin" && "(Admin)"}
                </span>
                {isAdmin && (
                  <Link href="/admin">
                    <Button className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]">Panel administrativo</Button>
                  </Link>
                )}
                <Button onClick={logout} className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]">
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleQrButtonClick}
                  className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white flex items-center gap-2"
                >
                  <QrCode size={20} />
                  LEER QR
                </Button>
                <Link href="/login">
                  <Button className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-7xl">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-white mb-8 md:mb-16">Bienvenidos</h1>

          {isRegularResident ? (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <ServiceCard image="/images/invitados.png" href="/invitados" width={150} height={150} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:gap-12 w-full max-w-4xl mb-12">
              {services.map((service, index) => (
                <div
                  key={index}
                  className={isLastItemAlone && index === services.length - 1 ? "col-span-2 flex justify-center" : ""}
                >
                  <ServiceCard image={service.image} href={service.href} width={150} height={150} />
                </div>
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
