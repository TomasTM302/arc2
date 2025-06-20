"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PlusCircle, ClipboardList, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import { useAuxiliarTasksStore } from "@/lib/auxiliar-tasks-store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import TaskDetailModal from "@/components/auxiliar/task-detail-modal"
import CompleteTaskModal from "@/components/auxiliar/complete-task-modal"
import AddReminderModal from "@/components/auxiliar/add-reminder-modal"
import { useRouter } from "next/navigation"

export default function AuxiliarPage() {
  const { user, isAuthenticated, isMantenimiento } = useAuthStore()
  const { tasks, updateTask } = useAuxiliarTasksStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)
  const router = useRouter()

  // Verificar que el usuario tenga acceso
  useEffect(() => {
    if (!isAuthenticated || !isMantenimiento) {
      router.push("/")
    }
  }, [isAuthenticated, isMantenimiento, router])

  // Filtrar tareas por usuario actual y que no estén completadas
  const myTasks = user ? tasks.filter((task) => task.assignedTo === user.id && task.status !== "completed") : []

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Función para abrir el modal de detalle
  const openTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsDetailModalOpen(true)
  }

  // Función para abrir el modal de completar tarea
  const openCompleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se abra el modal de detalle
    setSelectedTaskId(taskId)
    setIsCompleteModalOpen(true)
  }

  // Función para iniciar una tarea
  const startTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se abra el modal de detalle
    updateTask(taskId, { status: "in-progress" })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Mis Tareas</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddReminderModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Recordatorio
        </Button>
      </div>

      {myTasks.length > 0 ? (
        <div className="space-y-4 pb-16">
          {myTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border rounded-lg p-4 hover:bg-gray-50 cursor-pointer shadow-sm"
              onClick={() => openTaskDetail(task.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg text-black">{task.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    task.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {task.status === "pending" ? "Pendiente" : "En progreso"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{task.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                {task.condominium && (
                  <div>
                    <span className="font-medium">Condominio:</span> {task.condominium}
                  </div>
                )}
                {task.section && (
                  <div>
                    <span className="font-medium">Sección:</span> {task.section}
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Fecha límite: {formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                {task.status === "pending" ? (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => startTask(task.id, e)}
                  >
                    Iniciar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={(e) => openCompleteTask(task.id, e)}
                  >
                    Completar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm">
          <ClipboardList className="h-16 w-16 mb-4 text-gray-400" />
          <p className="text-lg text-gray-500">No hay tareas asignadas en este momento.</p>
        </div>
      )}

      {/* Modal de detalle de tarea */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          taskId={selectedTaskId}
        />
      )}

      {/* Modal para completar tarea */}
      {selectedTaskId && (
        <CompleteTaskModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          taskId={selectedTaskId}
        />
      )}

      {/* Modal para agregar recordatorio */}
      <AddReminderModal isOpen={isAddReminderModalOpen} onClose={() => setIsAddReminderModalOpen(false)} />
    </div>
  )
}
