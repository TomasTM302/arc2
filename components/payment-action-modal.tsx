"use client"

import { useState } from "react"
import { useAppStore, type MaintenancePayment } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, X } from "lucide-react"

interface PaymentActionModalProps {
  payment: MaintenancePayment
  isOpen: boolean
  onClose: () => void
}

export function PaymentActionModal({ payment, isOpen, onClose }: PaymentActionModalProps) {
  const { updateMaintenancePayment } = useAppStore()
  const [action, setAction] = useState<"completed" | "rejected">("completed")
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    setIsSubmitting(true)

    // Actualizar el estado del pago
    updateMaintenancePayment(payment.id, {
      status: action,
      notes: action === "rejected" ? justification : undefined,
      updatedBy: "admin", // Idealmente, esto vendría del contexto de autenticación
    })

    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Procesar Pago por Transferencia</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Residente:</p>
            <p className="font-medium text-black">{payment.userName}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Monto:</p>
            <p className="font-medium text-black">${payment.amount.toLocaleString()}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Fecha de pago reportada:</p>
            <p className="font-medium text-black">
              {new Date(payment.paymentDate).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-4">
            <RadioGroup value={action} onValueChange={(value) => setAction(value as "completed" | "rejected")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed" className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Aprobar pago
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  Rechazar pago
                </Label>
              </div>
            </RadioGroup>

            {action === "rejected" && (
              <div className="mt-4">
                <Label htmlFor="justification" className="block mb-2">
                  Justificación del rechazo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="justification"
                  placeholder="Explique el motivo del rechazo..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full"
                  rows={3}
                />
                {action === "rejected" && justification.trim() === "" && (
                  <p className="text-sm text-red-500 mt-1">La justificación es obligatoria para rechazar un pago</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="destructive" onClick={onClose} className="text-white">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (action === "rejected" && justification.trim() === "")}
          >
            {isSubmitting ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
