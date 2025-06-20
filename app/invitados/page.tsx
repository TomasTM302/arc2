"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ImageUpload from "@/components/image-upload"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, Download } from "lucide-react"
import Link from "next/link"
import { useVisitorStore } from "@/lib/visitor-store"
import { useAuthStore } from "@/lib/auth"

export default function InvitadosPage() {
  const router = useRouter()
  const { addVisitor } = useVisitorStore()
  const { user, isAuthenticated } = useAuthStore()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    visitDate: "",
    entryTime: "",
    destination: "",
    companions: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState<string>("")
  const [residentInfo, setResidentInfo] = useState({
    condominium: "",
    address: "",
  })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Obtener información del residente al cargar la página
  useEffect(() => {
    if (isAuthenticated && user) {
      // Extraer el nombre del condominio de la casa del usuario
      // Asumimos que el formato es "Condominio - Casa/Número"
      let condominium = "Residencial Arcos"
      let address = user.house || ""

      // Intentar extraer el condominio si está en el formato esperado
      if (user.house && user.house.includes("-")) {
        const parts = user.house.split("-")
        condominium = parts[0].trim()
        address = parts.slice(1).join("-").trim()
      }

      setResidentInfo({
        condominium,
        address,
      })

      // Actualizar el campo de destino con la dirección del residente
      setFormData((prev) => ({
        ...prev,
        destination: address,
      }))
    }
  }, [isAuthenticated, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    // Extract the field name without the prefix
    const fieldName = id.split("-").pop() || ""
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  // Modificar la función handleGenerateQR para que también registre al invitado
  const handleGenerateQR = (e: React.MouseEvent) => {
    e.preventDefault() // Prevenir comportamiento por defecto
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    setShowQR(false)

    try {
      // Validar campos mínimos requeridos
      const requiredFields = [
        { field: "name", message: "El nombre del invitado es obligatorio" },
        { field: "phone", message: "El teléfono es obligatorio" },
        { field: "visitDate", message: "La fecha de visita es obligatoria" },
        { field: "entryTime", message: "La hora máxima de entrada es obligatoria" },
        { field: "destination", message: "La dirección es obligatoria" },
      ]

      for (const { field, message } of requiredFields) {
        if (!formData[field]) {
          throw new Error(message)
        }
      }

      // Validar formato de teléfono (10 dígitos)
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
        throw new Error("El teléfono debe tener 10 dígitos")
      }

      // Validar que la fecha no sea anterior a hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const visitDate = new Date(formData.visitDate)
      if (visitDate < today) {
        throw new Error("La fecha de visita no puede ser anterior a hoy")
      }

      // Validar que el número de acompañantes sea un número válido (si se proporciona)
      if (formData.companions !== "") {
        const numAcompanantes = Number(formData.companions)
        if (isNaN(numAcompanantes) || numAcompanantes < 0 || !Number.isInteger(numAcompanantes)) {
          throw new Error("El número de acompañantes debe ser un número entero positivo o cero")
        }
      }

      // Registrar el visitante en el store
      const visitorData = {
        name: formData.name,
        phone: formData.phone,
        visitDate: formData.visitDate,
        entryTime: formData.entryTime,
        destination: formData.destination,
        companions: formData.companions,
        photoUrl: images.length > 0 ? images[0] : undefined,
      }

      // Añadir el visitante y obtener su ID
      addVisitor(visitorData)

      // Mostrar mensaje de éxito
      setSuccess("Invitado registrado correctamente")

      // Generar datos para el QR
      const acompanantesText = formData.companions ? `\nACOMPAÑANTES: ${formData.companions}` : ""
      const qrContent = `NOMBRE: ${formData.name}\nTELÉFONO: ${formData.phone}\nFECHA: ${formData.visitDate}\nHORA: ${formData.entryTime}\nDIRECCIÓN: ${formData.destination}${acompanantesText}`
      setQrData(qrContent)
      setShowQR(true)

      // Limpiar el formulario después de 5 segundos
      setTimeout(() => {
        setFormData({
          name: "",
          phone: "",
          visitDate: "",
          entryTime: "",
          destination: "",
          companions: "",
        })
        setImages([])
        setSuccess(null)
      }, 5000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Error al registrar el invitado")
      }
      // Hacer scroll hacia arriba para mostrar el mensaje de error
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleGenerateQR(e as unknown as React.MouseEvent)
  }

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages)
  }

  // Función para formatear la fecha en español
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("es-MX", options)
  }

  // Función para convertir una imagen a base64
  const getBase64Image = (imgUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const dataURL = canvas.toDataURL("image/png")
          resolve(dataURL)
        } else {
          reject(new Error("No se pudo obtener el contexto del canvas"))
        }
      }
      img.onerror = () => {
        reject(new Error("Error al cargar la imagen"))
      }
      img.src = imgUrl
    })
  }

  // Añadir la función exportToPDF después de la función handleImagesChange
  const exportToPDF = async () => {
    if (!showQR) return

    setIsGeneratingPDF(true)

    try {
      // Cargar dinámicamente jsPDF
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.default

      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Configurar fuentes y estilos
      doc.setFont("helvetica")

      try {
        // Crear el encabezado con fondo azul marino
        doc.setFillColor(14, 44, 82) // #0e2c52 - azul oscuro
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, "F")

        // Cargar el logo de ARCOS
        const logoBase64 = await getBase64Image("/images/arcos-logo.png")

        // Añadir el logo a la izquierda en el encabezado
        const logoWidth = 30
        const logoHeight = 30
        doc.addImage(logoBase64, "PNG", 10, 5, logoWidth, logoHeight)

        // Añadir el recuadro blanco para el título
        doc.setFillColor(255, 255, 255) // Blanco
        const titleBoxWidth = 120
        const titleBoxHeight = 30
        const titleBoxX = (doc.internal.pageSize.getWidth() - titleBoxWidth) / 2
        const titleBoxY = 5
        doc.roundedRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, 2, 2, "F")

        // Añadir título en el recuadro blanco
        doc.setTextColor(14, 44, 82) // #0e2c52
        doc.setFontSize(24)
        doc.setFont("helvetica", "bold")
        doc.text("PASE DE INVITADO", titleBoxX + titleBoxWidth / 2, titleBoxY + 12, { align: "center" })

        // Añadir subtítulo en el recuadro blanco
        doc.setFontSize(16)
        doc.setFont("helvetica", "normal")
        doc.text("Residencial Arcos", titleBoxX + titleBoxWidth / 2, titleBoxY + 22, { align: "center" })
      } catch (error) {
        console.error("Error al añadir el encabezado:", error)
      }

      // Añadir línea dorada debajo del encabezado
      doc.setDrawColor(214, 177, 94) // #d6b15e - dorado
      doc.setLineWidth(1)
      doc.line(0, 40, doc.internal.pageSize.getWidth(), 40)

      // Añadir información del invitado con fondo azul y texto blanco
      doc.setFillColor(14, 44, 82) // #0e2c52 - azul oscuro
      doc.rect(10, 50, doc.internal.pageSize.getWidth() - 20, 10, "F")

      doc.setTextColor(255, 255, 255) // Texto blanco
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("INFORMACIÓN DEL INVITADO", 15, 57)

      // Información del invitado (texto negro sobre fondo blanco)
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      doc.text(`Nombre: ${formData.name}`, 15, 70)
      doc.text(`Teléfono: ${formData.phone}`, 15, 77)
      doc.text(`Fecha de visita: ${formatDate(formData.visitDate)}`, 15, 84)
      doc.text(`Hora máxima de entrada: ${formData.entryTime}`, 15, 91)
      doc.text(`Dirección a visitar: ${formData.destination}`, 15, 98)

      if (formData.companions) {
        doc.text(`Acompañantes: ${formData.companions}`, 15, 105)
      }

      // Añadir información del residente con fondo azul y texto blanco
      doc.setFillColor(14, 44, 82) // #0e2c52 - azul oscuro
      doc.rect(10, 115, doc.internal.pageSize.getWidth() - 20, 10, "F")

      doc.setTextColor(255, 255, 255) // Texto blanco
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("INFORMACIÓN DEL RESIDENTE", 15, 122)

      // Información del residente (texto negro sobre fondo blanco)
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      doc.text(`Condominio: ${residentInfo.condominium}`, 15, 135)
      doc.text(`Dirección: ${residentInfo.address}`, 15, 142)

      if (user) {
        doc.text(`Residente: ${user.firstName} ${user.lastName}`, 15, 149)
      }

      // Añadir el código QR
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          try {
            // Calcular posición centrada para el QR
            const qrWidth = 70
            const qrHeight = 70
            const pageWidth = doc.internal.pageSize.getWidth()
            const xPos = (pageWidth - qrWidth) / 2

            // Añadir la imagen del QR al PDF
            doc.addImage(img, "PNG", xPos, 160, qrWidth, qrHeight)

            // Añadir texto debajo del QR con fondo azul y texto blanco
            doc.setFillColor(14, 44, 82) // #0e2c52 - azul oscuro
            doc.rect(10, 240, doc.internal.pageSize.getWidth() - 20, 10, "F")

            doc.setTextColor(255, 255, 255) // Texto blanco
            doc.setFontSize(10)
            doc.setFont("helvetica", "bold")
            doc.text("Este código QR debe ser presentado en la entrada del residencial", pageWidth / 2, 247, {
              align: "center",
            })

            // Añadir pie de página
            doc.setFontSize(8)
            doc.setTextColor(14, 44, 82) // #0e2c52
            doc.text(
              `Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
              pageWidth / 2,
              280,
              {
                align: "center",
              },
            )

            // Guardar el PDF
            doc.save(`Invitado-${formData.name.replace(/\s+/g, "-")}.pdf`)
            resolve(true)
          } catch (error) {
            console.error("Error al añadir el QR al PDF:", error)
            // Intentar guardar el PDF sin el QR
            doc.save(`Invitado-${formData.name.replace(/\s+/g, "-")}.pdf`)
            resolve(true)
          }
        }
        img.onerror = () => {
          console.error("Error al cargar la imagen del QR")
          // Intentar guardar el PDF sin el QR
          doc.save(`Invitado-${formData.name.replace(/\s+/g, "-")}.pdf`)
          resolve(true)
        }
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
      })
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      setError("Hubo un problema al generar el PDF. Por favor, inténtelo de nuevo.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al inicio
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8 mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">Registro de Invitados</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-700">
                Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
              </p>
            </div>

            {/* Información del invitado */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información del Invitado</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    placeholder="10 dígitos"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="visitDate" className="block text-sm font-medium">
                    Fecha de visita <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="visitDate"
                    value={formData.visitDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="entryTime" className="block text-sm font-medium">
                    Hora máxima de entrada <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="entryTime"
                    value={formData.entryTime}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="destination" className="block text-sm font-medium">
                  Dirección a visitar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  placeholder="Casa/Lote a visitar"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companions" className="block text-sm font-medium">
                  Número de acompañantes
                </label>
                <input
                  type="number"
                  id="companions"
                  value={formData.companions}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Subir foto del invitado (opcional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Fotografía del Invitado</h3>
              <p className="text-sm text-gray-500 mb-2">
                La fotografía es opcional, pero ayuda a identificar al invitado en la entrada.
              </p>
              <ImageUpload maxFiles={1} maxSize={5} onImagesChange={handleImagesChange} />
            </div>

            {/* Botones de acción */}
            <div className="pt-4">
              <Button
                type="button"
                className="bg-[#d6b15e] text-[#0e2c52] hover:bg-[#c4a14e] py-6 text-lg w-full"
                onClick={handleGenerateQR}
                disabled={isSubmitting}
              >
                <QrCode className="mr-2 h-5 w-5" />
                {isSubmitting ? "Procesando..." : "Generar QR y Registrar"}
              </Button>
            </div>
          </form>

          {/* Mostrar código QR generado */}
          {showQR && (
            <div className="mt-8 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-center">Código QR Generado</h3>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Este código QR contiene la información del invitado. Puede ser presentado en la entrada del residencial.
              </p>
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={exportToPDF}
                  className="bg-[#0e2c52] text-white hover:bg-[#0a2240] flex items-center"
                  disabled={isGeneratingPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGeneratingPDF ? "Generando PDF..." : "Exportar a PDF"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
