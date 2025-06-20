import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-[#0e2c52] py-6 border-t border-[#1a3a64]">
      <div className="container mx-auto flex flex-col items-center justify-center px-4">
        <div className="flex items-center mb-4">
          <div className="w-24 h-12 relative">
            <Image src="/images/arcos-logo.png" alt="ARCOS Logo" fill className="object-contain" />
          </div>
        </div>
        <p className="text-white text-sm mt-2">Desarrollado por Cero Uno Cero y ARC Residentials</p>
      </div>
    </footer>
  )
}
