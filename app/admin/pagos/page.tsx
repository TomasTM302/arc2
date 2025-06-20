"use client"

import { useState } from "react"
import { useAppStore, type MaintenancePayment } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Check, Clock, X, AlertCircle, MoreHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PaymentActionModal } from "@/components/payment-action-modal"

export default function AdminPaymentsPage() {
  const { maintenancePayments } = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [selectedPayment, setSelectedPayment] = useState<MaintenancePayment | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)

  // Agrupar pagos por usuario
  const paymentsByUser = maintenancePayments.reduce(
    (acc, payment) => {
      if (!acc[payment.userId]) {
        acc[payment.userId] = {
          userId: payment.userId,
          userName: payment.userName,
          payments: [],
        }
      }
      acc[payment.userId].payments.push(payment)
      return acc
    },
    {} as Record<string, { userId: string; userName: string; payments: typeof maintenancePayments }>,
  )

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = Object.values(paymentsByUser).filter((user) => {
    const matchesSearch = searchTerm === "" || user.userName.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtrar pagos del usuario según los filtros aplicados
    const filteredPayments = user.payments.filter((payment) => {
      const matchesYear = filterYear === "" || filterYear === "all" || payment.year.toString() === filterYear
      const matchesMonth = filterMonth === "" || filterMonth === "all" || payment.month.toString() === filterMonth
      const matchesStatus = filterStatus === "" || filterStatus === "all" || payment.status === filterStatus
      return matchesYear && matchesMonth && matchesStatus
    })

    // Solo incluir usuarios que tengan pagos que coincidan con los filtros
    return matchesSearch && filteredPayments.length > 0
  })

  // Obtener años únicos para el filtro
  const uniqueYears = Array.from(new Set(maintenancePayments.map((payment) => payment.year.toString()))).sort(
    (a, b) => Number.parseInt(b) - Number.parseInt(a),
  )

  // Obtener meses únicos para el filtro
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Función para obtener el nombre del mes
  const getMonthName = (month: number) => {
    return months.find((m) => m.value === month.toString())?.label || ""
  }

  // Función para obtener el color y el icono según el estado
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          label: "Pagado",
          icon: <Check className="h-4 w-4 mr-1" />,
        }
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          label: "Pendiente",
          icon: <Clock className="h-4 w-4 mr-1" />,
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800",
          label: "Rechazado",
          icon: <X className="h-4 w-4 mr-1" />,
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          label: "Desconocido",
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
        }
    }
  }

  // Función para obtener el nombre del método de pago
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "transfer":
        return "Transferencia"
      case "credit_card":
        return "Tarjeta de Crédito"
      default:
        return "Otro"
    }
  }

  // Función para abrir el modal de acción
  const handleOpenActionModal = (payment: MaintenancePayment) => {
    setSelectedPayment(payment)
    setIsActionModalOpen(true)
  }

  // Calcular estadísticas
  const totalPayments = maintenancePayments.length
  const completedPayments = maintenancePayments.filter((p) => p.status === "completed").length
  const pendingPayments = maintenancePayments.filter((p) => p.status === "pending").length
  const totalCollected = maintenancePayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)

  // Ejemplo de pago para pruebas
  const examplePayment = {
    id: "example-payment-1",
    userId: "example-user-1",
    userName: "Usuario de Ejemplo",
    amount: 1500,
    year: 2023,
    month: 5,
    paymentDate: new Date().toISOString(),
    status: "pending",
    paymentMethod: "transfer",
    notes: "Pago de prueba para demostración",
  }

  // Asegurarse de que el usuario de ejemplo esté en la lista si no hay otros usuarios
  if (filteredUsers.length === 0) {
    filteredUsers.push({
      userId: "example-user-1",
      userName: "Usuario de Ejemplo",
      payments: [examplePayment],
    })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Administración de Pagos</h1>
        <p className="text-gray-300">Gestiona y visualiza los pagos de mantenimiento de todos los residentes.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-gray-500 mb-2">Total Pagos</p>
            <p className="text-4xl font-bold text-black">{totalPayments}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-gray-500 mb-2">Pagos Completados</p>
            <p className="text-4xl font-bold text-green-600">{completedPayments}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-gray-500 mb-2">Pagos Pendientes</p>
            <p className="text-4xl font-bold text-amber-500">{pendingPayments}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-gray-500 mb-2">Total Recaudado</p>
            <p className="text-4xl font-bold text-black">${totalCollected.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="bg-[#0f2a4a] text-white">
              <SelectValue placeholder="Filtrar por año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="bg-[#0f2a4a] text-white">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-[#0f2a4a] text-white">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de usuarios con sus pagos */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Accordion type="single" collapsible key={user.userId} className="bg-white rounded-lg shadow">
              <AccordionItem value={user.userId}>
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center w-full">
                    <div className="font-medium text-black">{user.userName}</div>
                    <div className="text-sm text-gray-500">{user.payments.length} pagos registrados</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-black">Fecha</TableHead>
                        <TableHead className="text-black">Periodo</TableHead>
                        <TableHead className="text-black">Monto</TableHead>
                        <TableHead className="text-black">Método</TableHead>
                        <TableHead className="text-black">Estado</TableHead>
                        <TableHead className="text-black">Notas</TableHead>
                        <TableHead className="text-right text-black">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.payments
                        .filter((payment) => {
                          const matchesYear =
                            filterYear === "" || filterYear === "all" || payment.year.toString() === filterYear
                          const matchesMonth =
                            filterMonth === "" || filterMonth === "all" || payment.month.toString() === filterMonth
                          const matchesStatus =
                            filterStatus === "" || filterStatus === "all" || payment.status === filterStatus
                          return matchesYear && matchesMonth && matchesStatus
                        })
                        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                        .map((payment) => {
                          const statusInfo = getStatusInfo(payment.status)
                          return (
                            <TableRow key={payment.id}>
                              <TableCell className="text-black">{formatDate(payment.paymentDate)}</TableCell>
                              <TableCell className="text-black">
                                {getMonthName(payment.month)} {payment.year}
                              </TableCell>
                              <TableCell className="text-black">${payment.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-black">
                                {getPaymentMethodName(payment.paymentMethod)}
                              </TableCell>
                              <TableCell>
                                <Badge className={`flex items-center ${statusInfo.color}`}>
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-black">{payment.notes || "-"}</TableCell>
                              <TableCell className="text-right">
                                {payment.paymentMethod === "transfer" && payment.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenActionModal(payment)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <MoreHorizontal className="h-4 w-4 mr-1" />
                                    Acción
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No se encontraron pagos con los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Botón para exportar */}
      <div className="mt-6 flex justify-end">
        <Button className="flex items-center">
          <Download className="mr-2 h-4 w-4" />
          Exportar datos
        </Button>
      </div>

      {/* Modal para procesar pagos por transferencia */}
      {selectedPayment && (
        <PaymentActionModal
          payment={selectedPayment}
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false)
            setSelectedPayment(null)
          }}
        />
      )}
    </div>
  )
}
