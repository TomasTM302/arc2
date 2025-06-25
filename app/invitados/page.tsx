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
        destination: prev.destination || address,
      }))
    }
  }, [isAuthenticated, user])

  // Ensure destination auto-fills once resident information is available
  useEffect(() => {
    if (residentInfo.address && !formData.destination) {
      setFormData((prev) => ({ ...prev, destination: residentInfo.address }))
    }
  }, [residentInfo.address])

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
          destination: user?.house || residentInfo.address,
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

  // Convierte una imagen a Base64 usando fetch y FileReader
  const getBase64Image = async (url: string): Promise<string> => {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Genera el PDF con el formato solicitado
const exportToPDF = async () => {
  if (!showQR) return;
  setIsGeneratingPDF(true);

  try {
    // 1) Inicialización jsPDF y dimensiones
const jsPDFModule = await import("jspdf");
const jsPDF       = jsPDFModule.jsPDF || jsPDFModule.default;
const doc         = new jsPDF({ unit: "mm", format: "a4" });
const pageW       = doc.internal.pageSize.getWidth();

// 2) Marco exterior
doc
  .setDrawColor(14, 44, 82)
  .setLineWidth(2)
  .rect(5, 5, pageW - 10, 287, "S");

// 3) Header: título y fecha
const now = new Date();
doc
  .setFont("helvetica", "bold")
  .setFontSize(32)
  .setTextColor(14, 44, 82)
  .text("PASE DE INVITADO", 15, 32);
doc
  .setFont("helvetica", "normal")
  .setFontSize(10)
  .setTextColor(14, 44, 82)
  .text(
    `GENERADO EL ${now.toLocaleDateString("es-MX")} A LAS ${now
      .toLocaleTimeString("es-MX")
      .toUpperCase()}`,
    15,
    40
  );

// 4) Logo Monet (esquina superior derecha)
const logoMonet = await getBase64Image("/logo monet.png");
const logoW     = 40;
const logoH     = 40;
doc.addImage(logoMonet, "PNG", pageW - 25 - logoW, 15, logoW, logoH);

// 5) QR a la izquierda
const qrPayload = JSON.stringify({
  name: formData.name,
  phone: formData.phone,
  date: new Date(formData.visitDate).toISOString(),
  entry: formData.entryTime,
});
const qrBase64 = await getBase64Image(
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrPayload
  )}`
);
const qrSize = 80;
const qrX    = 15;
const qrY    = 60;
doc.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize);

// 6) Datos del invitado a la derecha del QR
let cursorY = qrY+20;
const textX = qrX + qrSize + 15;
const fields = [
  ["NOMBRE:", formData.name],
  ["TELÉFONO:", formData.phone],
  ["FECHA DE VISITA:", new Date(formData.visitDate).toLocaleDateString("es-MX")],
  ["HORA MÁX. ENTRADA:", formData.entryTime],
];
fields.forEach(([label, value]) => {
  doc
    .setFont("helvetica", "bold")
    .setFontSize(15)
    .setTextColor(14, 44, 82)
    .text(label, textX, cursorY);
  doc
    .setFont("helvetica", "bold")
    .setFontSize(18)
    .setTextColor(14, 44, 82)
    .text(value, textX, cursorY + 6);
  cursorY += 16;
});

// 7) Dirección y acompañantes en UNA COLUMNA
const leftX      = qrX;                    // mismo X que tu QR
let   bottomY    = qrY + qrSize + 10;      // justo debajo del QR
const labelSize  = 12;
const valueSize  = 15;
const indent     = 50;                     // sangría para el valor
const lineSpacing= 10;                     // separación entre líneas

// FILA 1: Dirección
doc
  .setFont("helvetica", "bold")
  .setFontSize(labelSize)
  .setTextColor(14, 44, 82)
  .text("DIRECCIÓN A VISITAR:", leftX, bottomY);
doc
  .setFont("helvetica", "normal")
  .setFontSize(valueSize)
  .text(formData.destination, leftX + indent, bottomY);

// Avanzamos Y para la siguiente línea
bottomY += lineSpacing;

// FILA 2: Acompañantes (si aplica)
if (formData.companions != null) {
  doc
    .setFont("helvetica", "bold")
    .setFontSize(labelSize)
    .text("ACOMPAÑANTES:", leftX, bottomY);
  doc
    .setFont("helvetica", "normal")
    .setFontSize(valueSize)
    .text(`${formData.companions}`, leftX + indent, bottomY);
}

// 8) Mapa estático y link
const mapBase64 = await getBase64Image("/logo monet.png");
const mapX      = textX ;
const mapY      = qrY + qrSize+15;
doc.addImage(mapBase64, "PNG", mapX, mapY, 80, 54);
doc
  .setFont("helvetica", "normal")
  .setFontSize(15)
  .setTextColor(0, 0, 200)
  .textWithLink(
    "Ver ubicación en Google Maps",
    mapX,
    mapY + 50,
    { url: "https://goo.gl/maps/XXXXXXXX" }
  );

// 9) Sección velocidad (rojo, paralelo)
let speedY = bottomY + 20;  // 20 mm de separación tras el último texto

doc
  .setFont("helvetica", "bold")
  .setFontSize(32)
  .setTextColor(220, 20, 60)
  .text("20", leftX, speedY);
doc
  .setFont("helvetica", "bold")
  .setFontSize(32)
  .text("KM/H", leftX + 20, speedY);
doc
  .setFont("helvetica", "bold")
  .setFontSize(18)
  .text("VELOCIDAD MÁXIMA", leftX, speedY + 14);
doc
  .setFont("helvetica", "bold")
  .setFontSize(18)
  .text("EVITA MULTAS", leftX, speedY + 28);



    // 10) Pie de página
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .setTextColor(150)
      .text("POWERED BY:", 130, 265);
    const logoPower = await getBase64Image("/images/arcos-logo.png");
    doc.addImage(logoPower, "PNG", 150, 258, 8, 10);
    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(14, 44, 82)
      .text(
        "ESTE CÓDIGO QR DEBE SER PRESENTADO EN LA ENTRADA DEL RESIDENCIAL",
        pageW / 2,
        275,
        { align: "center" }
      );

    // 11) Guardar el PDF
    doc.save(`Invitado-${formData.name.replace(/\s+/g, "-")}.pdf`);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    setError("Hubo un problema al generar el PDF. Por favor, inténtelo de nuevo.");
  } finally {
    setIsGeneratingPDF(false);
  }
};



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
