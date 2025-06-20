"use client"

import { useState, useEffect } from "react"
import { Plus, AlertCircle, XCircle, Edit, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthGuard from "@/components/auth-guard"
import { format, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import NewFineModal from "@/components/new-fine-modal"

// Tipos para las multas
interface Fine {
  id: string
  userId: string
  userName: string
  userHouse: string
  reason: string
  amount: number
  status: "pending" | "paid" | "cancelled"
  createdAt: string
  dueDate: string
  lateFee: number
  isOverdue?: boolean
  currentAmount?: number
  paidAt?: string
}

// Datos de ejemplo para multas existentes
const mockFines: Fine[] = [
  {
    id: "fine-1",
    userId: "resident-1",
    userName: "Usuario Residente",
    userHouse: "Casa 42",
    reason: "Estacionamiento en área prohibida",
    amount: 500,
    status: "pending",
    createdAt: "2023-06-15T10:30:00Z",
    dueDate: "2023-07-15",
    lateFee: 100,
  },
  {
    id: "fine-2",
    userId: "resident-2",
    userName: "María Rodríguez",
    userHouse: "Casa 15",
    reason: "Ruido excesivo después de las 23:00",
    amount: 800,
    status: "paid",
    createdAt: "2023-05-20T14:45:00Z",
    dueDate: "2023-06-20",
    lateFee: 150,
    paidAt: "2023-06-01T09:15:00Z",
  },
  {
    id: "fine-3",
    userId: "resident-3",
    userName: "Carlos Sánchez",
    userHouse: "Casa 78",
    reason: "No recoger desechos de mascota",
    amount: 300,
    status: "cancelled",
    createdAt: "2023-07-05T09:15:00Z",
    dueDate: "2023-08-05",
    lateFee: 50,
  },
  {
    id: "fine-4",
    userId: "resident-1",
    userName: "Usuario Residente",
    userHouse: "Casa 42",
    reason: "Modificación no autorizada de fachada",
    amount: 1200,
    status: "pending",
    createdAt: "2023-07-10T16:20:00Z",
    dueDate: "2023-07-01", // Ya vencida
    lateFee: 300,
  },
  {
    id: "fine-5",
    userId: "resident-4",
    userName: "Ana López",
    userHouse: "Casa 23",
    reason: "Uso indebido de áreas comunes",
    amount: 600,
    status: "paid",
    createdAt: "2023-06-25T11:30:00Z",
    dueDate: "2023-07-25",
    lateFee: 120,
    paidAt: "2023-07-05T14:20:00Z",
  },
]

export default function MultasPage() {
  const [fines, setFines] = useState<Fine[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewFineModalOpen, setIsNewFineModalOpen] = useState(false)

  // Actualizar el estado de las multas y calcular si están vencidas
  useEffect(() => {
    const today = new Date()
    const updatedFines = mockFines.map((fine) => {
      const dueDate = parseISO(fine.dueDate)
      const isOverdue = fine.status === "pending" && isAfter(today, dueDate)
      const currentAmount = isOverdue ? fine.amount + fine.lateFee : fine.amount

      return {
        ...fine,
        isOverdue,
        currentAmount,
      }
    })

    setFines(updatedFines)
  }, [])

  // Filtrar multas por término de búsqueda
  const filteredFines = fines.filter(
    (fine) =>
      fine.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.userHouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para cambiar el estado de una multa
  const changeStatus = (id: string, newStatus: "pending" | "paid" | "cancelled") => {
    setFines(
      fines.map((fine) =>
        fine.id === id
          ? {
              ...fine,
              status: newStatus,
              paidAt: newStatus === "paid" ? new Date().toISOString() : fine.paidAt,
            }
          : fine,
      ),
    )
  }

  // Función para cancelar una multa
  const cancelFine = (id: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta multa?")) {
      changeStatus(id, "cancelled")
    }
  }

  // Función para editar una multa
  const editFine = (id: string) => {
    alert(`Editar multa ${id} - Esta funcionalidad se implementará próximamente`)
  }

  // Función para obtener el color de estado
  const getStatusColor = (status: string, isOverdue?: boolean) => {
    if (status === "pending" && isOverdue) {
      return "bg-red-100 text-red-800"
    }

    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Función para obtener el texto de estado
  const getStatusText = (status: string, isOverdue?: boolean) => {
    if (status === "pending" && isOverdue) {
      return "Vencida"
    }

    switch (status) {
      case "paid":
        return "Pagada"
      case "pending":
        return "Pendiente"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconocido"
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Multas</h1>
              <p className="text-gray-300 mt-2">Gestiona las multas aplicadas a los residentes.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]"
                onClick={() => setIsNewFineModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Multa
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-6xl mx-auto">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nombre, casa o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            {filteredFines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No se encontraron multas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Residente</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Casa</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Motivo</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Monto</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Vencimiento</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Estado</th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFines.map((fine) => (
                      <tr key={fine.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">{fine.userName}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{fine.userHouse}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          <div className="max-w-xs truncate text-gray-800" title={fine.reason}>
                            {fine.reason}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {fine.isOverdue ? (
                            <div>
                              <span className="line-through text-gray-500">${fine.amount.toLocaleString()}</span>
                              <span className="block font-bold text-red-600">
                                ${fine.currentAmount?.toLocaleString()}
                              </span>
                              <span className="text-xs text-red-600">+${fine.lateFee.toLocaleString()} recargo</span>
                            </div>
                          ) : (
                            <span className="text-gray-800">${fine.amount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                            <span>{format(new Date(fine.dueDate), "d MMM yyyy", { locale: es })}</span>
                          </div>
                          {fine.isOverdue && (
                            <span className="text-xs text-red-600 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Vencida
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fine.status, fine.isOverdue)}`}
                          >
                            {getStatusText(fine.status, fine.isOverdue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {fine.status === "pending" ? (
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Modificar multa"
                                onClick={() => editFine(fine.id)}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800"
                                title="Cancelar multa"
                                onClick={() => cancelFine(fine.id)}
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-gray-400 text-xs">-</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modal para nueva multa */}
        <NewFineModal isOpen={isNewFineModalOpen} onClose={() => setIsNewFineModalOpen(false)} />
      </main>
    </AuthGuard>
  )
}
