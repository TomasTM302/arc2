"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Calendar, ArrowLeft, Building, Info, Copy, Check } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth"

export default function PagoMantenimientoPage() {
  // Obtener el precio de mantenimiento, fecha límite, recargo y datos bancarios del store
  const { maintenancePrice, maintenanceDueDay, maintenanceLatePaymentFee, bankingDetails } = useAppStore()
  const { user } = useAuthStore()

  const [showLatePaymentInfo, setShowLatePaymentInfo] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [copied, setCopied] = useState(false)

  // Modificar el estado para los pagos seleccionados para incluir multas y convenios individuales
  const [selectedPayments, setSelectedPayments] = useState({
    maintenance: true,
    fines: {} as Record<string, boolean>, // Cambio para seleccionar multas individuales
    agreements: {} as Record<string, boolean>, // Cambio para seleccionar convenios individuales
  })

  // Datos de ejemplo para multas y convenios
  const userFines = [
    { id: "fine-1", description: "Estacionamiento en área prohibida", amount: 500, dueDate: "2023-08-15" },
    { id: "fine-2", description: "Ruido excesivo", amount: 800, dueDate: "2023-09-01" },
  ]

  const userAgreements = [
    { id: "agreement-1", description: "Convenio de pago - Cuota 2/5", amount: 1200, dueDate: "2023-08-20" },
    { id: "agreement-2", description: "Convenio de pago - Cuota 3/5", amount: 1200, dueDate: "2023-09-20" },
  ]

  // Inicializar el estado de selección de multas y convenios
  useEffect(() => {
    const finesState = {} as Record<string, boolean>
    const agreementsState = {} as Record<string, boolean>

    // Inicializar todas las multas como no seleccionadas
    userFines.forEach((fine) => {
      finesState[fine.id] = false
    })

    // Inicializar todos los convenios como no seleccionadas
    userAgreements.forEach((agreement) => {
      agreementsState[agreement.id] = false
    })

    setSelectedPayments((prev) => ({
      ...prev,
      fines: finesState,
      agreements: agreementsState,
    }))
  }, [])

  // Determinar si hoy es después de la fecha límite
  const today = new Date()
  const currentDay = today.getDate()
  const isLate = currentDay > maintenanceDueDay

  // Calcular el monto a pagar basado en las selecciones
  const maintenanceAmount = selectedPayments.maintenance
    ? isLate
      ? maintenancePrice + maintenanceLatePaymentFee
      : maintenancePrice
    : 0

  // Calcular el monto de multas seleccionadas
  const finesAmount = userFines.reduce((sum, fine) => {
    return sum + (selectedPayments.fines[fine.id] ? fine.amount : 0)
  }, 0)

  // Calcular el monto de convenios seleccionados
  const agreementsAmount = userAgreements.reduce((sum, agreement) => {
    return sum + (selectedPayments.agreements[agreement.id] ? agreement.amount : 0)
  }, 0)

  const totalAmount = maintenanceAmount + finesAmount + agreementsAmount

  // Función para manejar la selección de todas las multas
  const handleSelectAllFines = (checked: boolean) => {
    const newFinesState = { ...selectedPayments.fines }
    userFines.forEach((fine) => {
      newFinesState[fine.id] = checked
    })

    setSelectedPayments((prev) => ({
      ...prev,
      fines: newFinesState,
    }))
  }

  // Función para manejar la selección de todos los convenios
  const handleSelectAllAgreements = (checked: boolean) => {
    const newAgreementsState = { ...selectedPayments.agreements }
    userAgreements.forEach((agreement) => {
      newAgreementsState[agreement.id] = checked
    })

    setSelectedPayments((prev) => ({
      ...prev,
      agreements: newAgreementsState,
    }))
  }

  // Función para manejar la selección de una multa individual
  const handleSelectFine = (fineId: string, checked: boolean) => {
    setSelectedPayments((prev) => ({
      ...prev,
      fines: {
        ...prev.fines,
        [fineId]: checked,
      },
    }))
  }

  // Función para manejar la selección de un convenio individual
  const handleSelectAgreement = (agreementId: string, checked: boolean) => {
    setSelectedPayments((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [agreementId]: checked,
      },
    }))
  }

  // Versión simplificada de la función generateReference()
  const generateReference = () => {
    if (!user) return "REF-INVALIDA"

    // Extraer solo los números de la casa (o usar los últimos 2-3 caracteres si no hay números)
    const houseMatch = user.house.match(/\d+/)
    const houseNum = houseMatch ? houseMatch[0] : user.house.slice(-2)

    // Crear un código simple para el tipo de pago
    let typeCode = ""
    if (selectedPayments.maintenance) typeCode += "M"

    // Contar cuántas multas y convenios están seleccionados
    const finesCount = Object.values(selectedPayments.fines).filter(Boolean).length
    const agreementsCount = Object.values(selectedPayments.agreements).filter(Boolean).length

    if (finesCount > 0) typeCode += "F"
    if (agreementsCount > 0) typeCode += "C"

    // Generar un número aleatorio de 3 dígitos para hacer la referencia única
    const randomNum = Math.floor(Math.random() * 900) + 100

    // Formato final: CASA-TIPO-RANDOM
    // Ejemplo: 42-MFC-123
    return `${houseNum}-${typeCode}-${randomNum}`
  }

  const reference = generateReference()

  // Función para copiar la referencia al portapapeles
  const copyReference = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/home" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al inicio
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md text-gray-800 mx-auto">
          <h2 className="text-xl font-semibold mb-4">Información de Pago</h2>

          {/* Información de fecha límite */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start">
            <Calendar className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Fecha límite de pago:</span> Día {maintenanceDueDay} de cada mes
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los pagos realizados después de esta fecha tendrán un recargo de $
                {maintenanceLatePaymentFee.toLocaleString()}
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="property" className="block text-sm font-medium">
                Propiedad
              </label>
              <select
                id="property"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] text-gray-800"
                defaultValue={user?.house || ""}
              >
                <option value={user?.house || ""}>{user?.house || "Seleccionar propiedad"}</option>
              </select>
            </div>

            {/* Selección de pagos */}
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-sm border-b pb-2 mb-2">Seleccione lo que desea pagar:</h3>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="maintenance"
                  checked={selectedPayments.maintenance}
                  onCheckedChange={(checked) =>
                    setSelectedPayments({ ...selectedPayments, maintenance: checked === true })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="maintenance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mantenimiento mensual
                  </label>
                  <p className="text-xs text-muted-foreground">
                    ${maintenancePrice.toLocaleString()}
                    {isLate && (
                      <span className="text-red-500"> + ${maintenanceLatePaymentFee.toLocaleString()} (recargo)</span>
                    )}
                  </p>
                </div>
              </div>

              {userFines.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Multas pendientes</h4>
                    <div className="flex items-center">
                      <Checkbox
                        id="select-all-fines"
                        checked={
                          Object.values(selectedPayments.fines).every((v) => v === true) &&
                          Object.keys(selectedPayments.fines).length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAllFines(checked === true)}
                      />
                      <label htmlFor="select-all-fines" className="ml-2 text-xs text-gray-600">
                        Seleccionar todas
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    {userFines.map((fine) => (
                      <div key={fine.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded">
                        <Checkbox
                          id={fine.id}
                          checked={selectedPayments.fines[fine.id] || false}
                          onCheckedChange={(checked) => handleSelectFine(fine.id, checked === true)}
                        />
                        <div className="grid gap-0.5 leading-none flex-1">
                          <div className="flex justify-between items-center">
                            <label
                              htmlFor={fine.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {fine.description}
                            </label>
                            <span className="text-sm font-semibold">${fine.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">Vencimiento: {fine.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userAgreements.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Convenios de pago</h4>
                    <div className="flex items-center">
                      <Checkbox
                        id="select-all-agreements"
                        checked={
                          Object.values(selectedPayments.agreements).every((v) => v === true) &&
                          Object.keys(selectedPayments.agreements).length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAllAgreements(checked === true)}
                      />
                      <label htmlFor="select-all-agreements" className="ml-2 text-xs text-gray-600">
                        Seleccionar todas
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    {userAgreements.map((agreement) => (
                      <div key={agreement.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded">
                        <Checkbox
                          id={agreement.id}
                          checked={selectedPayments.agreements[agreement.id] || false}
                          onCheckedChange={(checked) => handleSelectAgreement(agreement.id, checked === true)}
                        />
                        <div className="grid gap-0.5 leading-none flex-1">
                          <div className="flex justify-between items-center">
                            <label
                              htmlFor={agreement.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {agreement.description}
                            </label>
                            <span className="text-sm font-semibold">${agreement.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">Vencimiento: {agreement.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium">
                Monto a pagar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  value={totalAmount}
                  readOnly
                  className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] bg-gray-50 text-gray-800"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Total a pagar</p>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowLatePaymentInfo(!showLatePaymentInfo)}
                >
                  Ver desglose
                </button>
              </div>

              {/* Actualizar la sección de desglose para mostrar solo los elementos seleccionados */}
              {showLatePaymentInfo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedPayments.maintenance && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Cuota de mantenimiento:</span>
                        <span>${maintenancePrice.toLocaleString()}</span>
                      </div>
                      {isLate && (
                        <div className="flex justify-between text-red-600">
                          <span>Recargo por pago tardío:</span>
                          <span>${maintenanceLatePaymentFee.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}

                  {userFines.map(
                    (fine) =>
                      selectedPayments.fines[fine.id] && (
                        <div key={fine.id} className="flex justify-between mb-1">
                          <span>Multa: {fine.description}</span>
                          <span>${fine.amount.toLocaleString()}</span>
                        </div>
                      ),
                  )}

                  {userAgreements.map(
                    (agreement) =>
                      selectedPayments.agreements[agreement.id] && (
                        <div key={agreement.id} className="flex justify-between mb-1">
                          <span>{agreement.description}</span>
                          <span>${agreement.amount.toLocaleString()}</span>
                        </div>
                      ),
                  )}

                  <div className="border-t border-gray-200 mt-2 pt-2 font-medium flex justify-between">
                    <span>Total:</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {isLate && selectedPayments.maintenance && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Pago con recargo</p>
                    <p>
                      Se ha aplicado un recargo de ${maintenanceLatePaymentFee.toLocaleString()} por pago después del
                      día límite.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="payment-method" className="block text-sm font-medium">
                Método de pago
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value)
                  setShowBankDetails(e.target.value === "transfer")
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] text-gray-800"
              >
                <option value="">Seleccionar método de pago</option>
                <option value="card">Tarjeta de crédito/débito</option>
                <option value="transfer">Transferencia bancaria</option>
              </select>
            </div>

            {/* Mostrar datos bancarios si se selecciona transferencia */}
            {showBankDetails && bankingDetails && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-600" />
                  Datos para transferencia
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Banco</p>
                    <p className="font-medium">{bankingDetails.bankName}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Titular</p>
                    <p className="font-medium">{bankingDetails.accountHolder}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">CLABE</p>
                    <p className="font-medium">{bankingDetails.clabe}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-500">Referencia</p>
                      <button type="button" onClick={copyReference} className="text-xs text-blue-600 flex items-center">
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-medium bg-blue-50 p-2 rounded mt-1 text-center">{reference}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Esta referencia incluye información sobre su pago. Por favor úsela exactamente como se muestra.
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Una vez realizada la transferencia, por favor envíe el comprobante de pago a la administración para
                    registrar su pago. Incluya la referencia en el concepto de la transferencia.
                  </p>
                </div>
              </div>
            )}

            <Button className="w-full bg-[#4a9eff] hover:bg-[#3b8de0] text-white">
              {paymentMethod === "transfer" ? "Confirmar pago por transferencia" : "Continuar con el pago"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
