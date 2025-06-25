import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TaskStatus = "pending" | "in-progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"

// Actualizar la interfaz Task para incluir los campos de sección y condominio
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string
  assignedBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  comments?: Comment[]
  isPersonalReminder?: boolean
  section?: string // Cambiado de condominio a sección
  condominium?: string // Nuevo campo para condominio
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

// Interfaz para reportes del personal de mantenimiento
export interface Report {
  id: string
  title: string
  description: string
  mantenimientoId: string
  mantenimientoName: string
  createdAt: string
  images?: string[]
  taskId?: string
  status: "pending" | "reviewed" | "completed"
  section?: string // Añadido para guardar la sección
  condominium?: string // Añadido para guardar el condominio
}

interface MantenimientoTasksState {
  tasks: Task[]
  reports: Report[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "comments" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  addComment: (taskId: string, userId: string, userName: string, content: string) => void
  addReport: (report: Omit<Report, "id" | "createdAt">) => void
  updateReport: (id: string, updates: Partial<Report>) => void
  deleteReport: (id: string) => void
}

export const useMantenimientoTasksStore = create<MantenimientoTasksState>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: "task-1",
          title: "Revisar iluminación en área común",
          description: "Verificar que todas las luces del área de alberca funcionen correctamente",
          status: "pending",
          priority: "high",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: "auxiliar-1",
          assignedBy: "admin-1",
          comments: [],
          section: "Alberca", // Cambiado de condominio a sección
          condominium: "Condominio 1-Los Arcos", // Añadido condominio
        },
        {
          id: "task-2",
          title: "Mantenimiento de jardín principal",
          description: "Podar arbustos y revisar sistema de riego",
          status: "in-progress",
          priority: "medium",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: "auxiliar-1",
          assignedBy: "admin-1",
          comments: [],
          section: "Jardines", // Cambiado de condominio a sección
          condominium: "Condominio 2-Las Palmas", // Añadido condominio
        },
      ],
      reports: [
        {
          id: "report-1",
          title: "Reparación de iluminación en alberca",
          description: "Se reemplazaron 3 focos LED en el área de la alberca que no funcionaban",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          mantenimientoId: "auxiliar-1",
          mantenimientoName: "Auxiliar Mantenimiento",
          status: "completed",
        },
      ],
      addTask: (task) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: `task-${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              comments: [],
            },
          ],
        }))
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
          ),
        }))
      },
      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, status: "completed" } : task)),
        }))
      },
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },
      addComment: (taskId, userId, userName, content) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: [
                    ...task.comments,
                    {
                      id: `comment-${Date.now()}`,
                      taskId,
                      userId,
                      userName,
                      content,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : task,
          ),
        }))
      },
      addReport: (report) => {
        set((state) => ({
          reports: [
            ...state.reports,
            {
              ...report,
              id: `report-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
      },
      updateReport: (id, updates) => {
        set((state) => ({
          reports: state.reports.map((report) => (report.id === id ? { ...report, ...updates } : report)),
        }))
      },
      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        }))
      },
    }),
    {
      name: "mantenimiento-tasks-storage",
    },
  ),
)
