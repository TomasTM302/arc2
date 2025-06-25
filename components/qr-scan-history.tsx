
"use client"

import { useEffect, useState, Fragment } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// 1) Función de validación robusta (hoy y posteriores, hora ≥ ahora+1h)
function validateDateTime(dateStr: string, timeStr: string): string | null {
  const dateParts = dateStr.split("-").map(Number)
  if (dateParts.length !== 3) {
    return "Formato de fecha inválido (debe ser YYYY-MM-DD)"
  }
  const [year, month, day] = dateParts
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const visitDate = new Date(year, month - 1, day)
  visitDate.setHours(0, 0, 0, 0)

  if (visitDate < today) {
    return "La fecha de visita no puede ser anterior a hoy"
  }

  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return "Formato de hora inválido (debe ser HH:MM)"
  }
  const [h, m] = timeStr.split(":").map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return "Hora o minutos fuera de rango"
  }

  const entryDate = new Date(year, month - 1, day, h, m)
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  if (entryDate < oneHourLater) {
    return "La hora de entrada debe ser al menos una hora posterior a la actual"
  }

  return null
}

// Parse the raw QR string into key/value pairs
function parseQrData(data: string): Record<string, string> {
  const lines = data.split("\n")
  const result: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(":")
    if (idx !== -1) {
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      result[key] = value
    }
  }
  return result
}

// Labels for well known QR fields
function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    NOMBRE: "Nombre",
    TELÉFONO: "Teléfono",
    TELEFONO: "Teléfono",
    FECHA: "Fecha de visita",
    HORA: "Hora de entrada",
    DIRECCIÓN: "Destino",
    DIRECCION: "Destino",
    ACOMPAÑANTES: "Acompañantes",
    ACOMPANANTES: "Acompañantes",
  }
  return labels[key] || key
}

interface ScanHistoryItem {
  id: number
  scanned_at: string
  ine?: string | null
  tipo?: string | null
  placa_vehiculo?: string | null
  fecha_entrada?: string | null
  fecha_salida?: string | null
  vigilante_id?: number | null
  condominio_id?: number | null
}

export default function EntryHistoryTable() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/entry-history")
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al obtener historial")
      }
      setHistory(data.data)
    } catch (e: any) {
      setError("No se pudo cargar el historial.")
      toast({
        title: "Error al cargar historial",
        description: e.message || "Ocurrió un error desconocido.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      const res = await fetch("/api/entry-history", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al borrar historial")
      }
      setHistory([])
      toast({
        title: "Historial Borrado",
        description: "Todos los registros del historial han sido eliminados.",
      })
    } catch (e: any) {
      toast({
        title: "Error al borrar historial",
        description: e.message || "No se pudo borrar el historial.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <Card className="w-full max-w-2xl mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Entradas</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refrescar</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={history.length === 0}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Borrar Historial</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se borrarán permanentemente todos los registros del historial de entradas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">
                  Borrar Todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p>Cargando historial...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && history.length === 0 && <p>No hay registros en el historial.</p>}
        {!loading && !error && history.length > 0 && (
          <ScrollArea className="h-[300px]">
            <ul className="space-y-2">
              {history.map((item) => {
                const qrData = parseQrData(item.scanned_at)
                // Validamos fecha/hora del QR
                const validationError = qrData.FECHA && qrData.HORA
                  ? validateDateTime(qrData.FECHA, qrData.HORA)
                  : "Faltan FECHA o HORA en el QR"
                return (
                  <li key={item.id} className="p-3 border rounded-md bg-muted/50 space-y-2">
                    {validationError ? (
                      <p className="text-sm font-medium text-red-600">
                        ⚠️ Registro inválido: {validationError}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Datos QR</p>
                        <div className="grid grid-cols-[auto,1fr] gap-x-2 text-xs text-muted-foreground mb-2">
                          {Object.entries(qrData).map(([key, value]) => (
                            <Fragment key={key}>
                              <span className="font-medium">{getFieldLabel(key)}:</span>
                              <span className="truncate">{value}</span>
                            </Fragment>
                          ))}
                        </div>
                        {item.fecha_entrada && (
                          <p className="text-xs text-muted-foreground">
                            Entrada: {new Date(item.fecha_entrada).toLocaleString()}
                          </p>
                        )}
                        {item.fecha_salida && (
                          <p className="text-xs text-muted-foreground">
                            Salida: {new Date(item.fecha_salida).toLocaleString()}
                          </p>
                        )}
                        {item.tipo && <p className="text-xs text-muted-foreground">Tipo: {item.tipo}</p>}
                        {(item.ine || item.placa_vehiculo) && (
                          <div className="flex gap-2 mt-1">
                            {item.ine && (
                              <a
                                href={item.ine}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-xs truncate underline"
                              >
                                INE
                              </a>
                            )}
                            {item.placa_vehiculo && (
                              <a
                                href={item.placa_vehiculo}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-xs truncate underline"
                              >
                                Placa
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
