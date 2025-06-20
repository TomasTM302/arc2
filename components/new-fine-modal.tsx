"use client"

import type React from "react"

import { useState } from "react"
import { X, Save, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"

interface NewFineModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewFineModal({ isOpen, onClose }: NewFineModalProps) {
  const { getUsers } = useAuthStore()
  const users = getUsers()

  const [formData, setFormData] = useState({
    userId: "",
    reason: "",
    amount: "",
    dueDate: "",
    lateFee: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate form
    if (!formData.userId) {
      setError("Por favor seleccione un usuario")
      setIsSubmitting(false)
      return
    }

    if (!formData.reason) {
      setError("Por favor ingrese el motivo de la multa")
      setIsSubmitting(false)
      return
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError("Por favor ingrese un monto válido")
      setIsSubmitting(false)
      return
    }

    if (!formData.dueDate) {
      setError("Por favor seleccione una fecha de vencimiento")
      setIsSubmitting(false)
      return
    }

    if (!formData.lateFee || isNaN(Number(formData.lateFee)) || Number(formData.lateFee) < 0) {
      setError("Por favor ingrese un recargo válido")
      setIsSubmitting(false)
      return
    }

    // Validate that due date is in the future
    const dueDate = new Date(formData.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time part for proper comparison

    if (dueDate < today) {
      setError("La fecha de vencimiento debe ser futura")
      setIsSubmitting(false)
      return
    }

    // In a real app, you would save the data to your backend here
    console.log("Multa creada:", {
      ...formData,
      amount: Number(formData.amount),
      lateFee: Number(formData.lateFee),
      status: "pending",
      createdAt: new Date().toISOString(),
    })

    // Show success message
    setSuccess("Multa creada exitosamente")
    setIsSubmitting(false)

    // Reset form and close modal after delay
    setTimeout(() => {
      onClose()

      // Reset form after the modal is closed
      setFormData({
        userId: "",
        reason: "",
        amount: "",
        dueDate: "",
        lateFee: "",
      })
      setSuccess(null)
    }, 2000)
  }

  // Calculate minimum date for due date (today)
  const today = new Date()
  const minDate = today.toISOString().split("T")[0]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Nueva Multa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de usuario */}
          <div className="space-y-2">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              Residente
            </label>
            <select
              id="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              required
            >
              <option value="">Seleccionar residente</option>
              {users
                .filter((user) => user.role === "resident")
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} - {user.house}
                  </option>
                ))}
            </select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Motivo de la multa
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              placeholder="Describa el motivo de la multa"
              required
            ></textarea>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Monto
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                type="text"
                id="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Fecha de vencimiento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={minDate}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                required
              />
            </div>
            <p className="text-xs text-gray-500">Fecha límite para pagar sin recargo adicional</p>
          </div>

          {/* Recargo por pago extemporáneo */}
          <div className="space-y-2">
            <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700">
              Recargo por pago extemporáneo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                type="text"
                id="lateFee"
                value={formData.lateFee}
                onChange={handleChange}
                className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Monto adicional que se cobrará si no se paga antes de la fecha de vencimiento
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Información importante</p>
              <p>
                Si la multa no es pagada antes de la fecha de vencimiento, el recargo por pago extemporáneo se añadirá
                automáticamente al monto total.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onClose}
              className="text-white font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Multa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
