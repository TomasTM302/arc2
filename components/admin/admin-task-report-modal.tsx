"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminTasksStore, type AdminTaskReport } from "@/lib/admin-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Filter, Calendar, Download } from "lucide-react"
import dynamic from "next/dynamic"

const AdminTaskReportModal = dynamic(() => Promise.resolve(AdminTaskReportModalComponent), { ssr: false })

interface AdminTaskReportModalProps {
  isOpen: boolean
  onClose: () => void
}

function AdminTaskReportModalComponent({ isOpen, onClose }: AdminTaskReportModalProps) {
  const { getTaskReport } = useAdminTasksStore()
  const { users } = useAuthStore()
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Obtener solo usuarios administrativos
  const adminUsers = users.filter((user) => user.role === "admin")

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? `${user.firstName} ${user.lastName}` : "Usuario desconocido"
  }

  // Función para exportar a PDF
  const exportToPDF = async () => {
    setIsGenerating(true)

    try {
      // Dynamically import jsPDF and jspdf-autotable only when needed
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.default
      await import("jspdf-autotable")

      // Create new document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add header
      doc.setFillColor(13, 44, 82)
      doc.rect(0, 0, 210, 20, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text("REPORTE DE TAREAS ADMINISTRATIVAS - CONFIDENCIAL", 105, 12, { align: "center" })

      // Add watermark
      doc.setTextColor(230, 230, 230)
      doc.setFontSize(60)
      doc.text("CONFIDENCIAL", 105, 150, { align: "center", angle: 45 })

      // Restore color for content
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)

      // Add report information
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`, 14, 30)
      doc.text(`Período: ${startDate || "Inicio"} - ${endDate || "Actual"}`, 14, 38)
      doc.text(`Usuario: ${selectedUser === "all" ? "Todos" : getUserName(selectedUser)}`, 14, 46)

      // Generate tables for each user
      let yPos = 60

      // Obtener reportes filtrados
      const reports: AdminTaskReport[] = getTaskReport(
        selectedUser !== "all" ? selectedUser : undefined,
        startDate || undefined,
        endDate || undefined,
      )

      reports.forEach((report) => {
        doc.setFontSize(14)
        doc.text(`Reporte de: ${getUserName(report.userId)}`, 14, yPos)
        yPos += 10

        // Summary table
        doc.autoTable({
          startY: yPos,
          head: [["Total Tareas", "Completadas", "Pendientes", "En Progreso", "Tiempo Promedio"]],
          body: [
            [
              report.totalTasks,
              report.completedTasks,
              report.pendingTasks,
              report.inProgressTasks,
              report.averageCompletionTime ? `${report.averageCompletionTime.toFixed(2)} días` : "N/A",
            ],
          ],
          theme: "grid",
          headStyles: { fillColor: [13, 44, 82] },
        })

        // @ts-ignore - TypeScript doesn't know about the lastAutoTable property
        yPos = doc.lastAutoTable.finalY + 10

        // Tasks table
        const tableRows = report.tasks.map((task) => [
          task.title,
          formatDate(task.assignedAt),
          task.completedAt ? formatDate(task.completedAt) : "Pendiente",
          task.status === "completed" ? "Completada" : task.status === "in-progress" ? "En progreso" : "Pendiente",
          task.timeToComplete ? `${task.timeToComplete.toFixed(2)} días` : "N/A",
        ])

        doc.autoTable({
          startY: yPos,
          head: [["Título", "Asignada", "Completada", "Estado", "Tiempo"]],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [13, 44, 82] },
        })

        // @ts-ignore - TypeScript doesn't know about the lastAutoTable property
        yPos = doc.lastAutoTable.finalY + 20

        // Add new page if needed
        if (yPos > 250 && reports.indexOf(report) < reports.length - 1) {
          doc.addPage()
          yPos = 20
        }
      })

      // Add footer with confidentiality information
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(
          "Este documento contiene información confidencial y es para uso exclusivo del personal autorizado.",
          105,
          285,
          { align: "center" },
        )
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" })
      }

      // Save PDF
      doc.save(`reporte-tareas-administrativas-${new Date().toISOString().split("T")[0]}.pdf`)
      setIsGenerating(false)
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      alert("Ocurrió un error al generar el PDF. Por favor, intenta de nuevo.")
      setIsGenerating(false)
    }
  }

  // Generar reporte
  const reports: AdminTaskReport[] = getTaskReport(
    selectedUser !== "all" ? selectedUser : undefined,
    startDate || undefined,
    endDate || undefined,
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Reporte de Tareas Administrativas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Label htmlFor="user-filter" className="block mb-2">
                Usuario
              </Label>
              <div className="relative">
                <Button
                  id="user-filter"
                  variant="outline"
                  className="w-full flex items-center justify-between bg-gray-200 text-black hover:bg-gray-300"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedUser === "all" ? "Todos los usuarios" : getUserName(selectedUser)}
                  </div>
                </Button>
                <div
                  className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10"
                  style={{ display: isUserMenuOpen ? "block" : "none" }}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setSelectedUser("all")
                        setIsUserMenuOpen(false)
                      }}
                    >
                      Todos los usuarios
                    </button>
                    {adminUsers.map((user) => (
                      <button
                        key={user.id}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedUser(user.id)
                          setIsUserMenuOpen(false)
                        }}
                      >
                        {user.firstName} {user.lastName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="start-date" className="block mb-2">
                Fecha inicio
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start-date"
                  type="date"
                  className="pl-10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end-date" className="block mb-2">
                Fecha fin
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Resultados del reporte */}
          <div className="space-y-8">
            {reports.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No hay datos disponibles</h4>
                <p className="text-gray-500">No se encontraron tareas que coincidan con los criterios de búsqueda.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.userId}
                  className="border rounded-lg p-6"
                  style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)" }}
                >
                  <h3 className="text-xl font-semibold mb-4">{getUserName(report.userId)}</h3>

                  {/* Resumen */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.totalTasks}</div>
                      <div className="text-gray-500">Total tareas</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.completedTasks}</div>
                      <div className="text-green-600">Completadas</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.pendingTasks}</div>
                      <div className="text-yellow-600">Pendientes</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.inProgressTasks}</div>
                      <div className="text-orange-600">En progreso</div>
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold">Tiempo promedio de completado</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {report.averageCompletionTime
                          ? `${report.averageCompletionTime.toFixed(2)} días`
                          : "No disponible"}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold">Última tarea completada</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {report.lastCompletedTask ? formatDate(report.lastCompletedTask) : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de tareas */}
                  <h4 className="text-lg font-semibold mb-3">Detalle de tareas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-left">Título</th>
                          <th className="py-2 px-3 text-left">Asignada</th>
                          <th className="py-2 px-3 text-left">Completada</th>
                          <th className="py-2 px-3 text-left">Estado</th>
                          <th className="py-2 px-3 text-left">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tasks.map((task) => (
                          <tr key={task.id} className="border-t">
                            <td className="py-2 px-3">{task.title}</td>
                            <td className="py-2 px-3">{formatDate(task.assignedAt)}</td>
                            <td className="py-2 px-3">
                              {task.completedAt ? formatDate(task.completedAt) : "Pendiente"}
                            </td>
                            <td className="py-2 px-3">
                              {task.status === "completed" ? (
                                <span className="text-green-600">Completada</span>
                              ) : task.status === "in-progress" ? (
                                <span className="text-orange-600">En progreso</span>
                              ) : (
                                <span className="text-yellow-600">Pendiente</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {task.timeToComplete ? `${task.timeToComplete.toFixed(2)} días` : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botón para exportar a PDF */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={exportToPDF}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isGenerating || reports.length === 0}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generando PDF...
                </span>
              ) : (
                <span className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminTaskReportModal
