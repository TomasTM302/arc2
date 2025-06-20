"use client"

import { useEffect, useState } from "react"

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
import Image from "next/image"

interface ScanHistoryItem {
  id: number
  scanned_at: string
  qr_data: string
  license_plate_image_url?: string | null // Añadido
  ine_image_url?: string | null // Añadido
}

export default function QrScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    console.log("QrScanHistory - fetchHistory: Fetching history...")
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/scan-history")
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al obtener historial")
      }
      console.log(
        "QrScanHistory - fetchHistory: Setting history with (first 5 items):",
        data.data.slice(0, 5),
      )
      setHistory(data.data)
    } catch (e: any) {
      console.error("QrScanHistory - fetchHistory: Error fetching:", e)
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
      const res = await fetch("/api/scan-history", { method: "DELETE" })
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
      console.error("Error clearing scan history:", e)
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
        <CardTitle>Historial de Escaneos</CardTitle>
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
                  Esta acción no se puede deshacer. Se borrarán permanentemente todos los registros del historial de
                  escaneos.
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
              {history.map((item) => (
                <li key={item.id} className="p-3 border rounded-md bg-muted/50 space-y-2">
                  <div>
                    <p className="text-sm font-medium truncate" title={item.qr_data}>
                      Dato QR: {item.qr_data}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Escaneado: {new Date(item.scanned_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    {item.license_plate_image_url && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Placa:</p>
                        <a href={item.license_plate_image_url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={item.license_plate_image_url || "/placeholder.svg"}
                            alt="Foto de placa"
                            width={100}
                            height={75}
                            className="rounded object-contain border"
                          />
                        </a>
                      </div>
                    )}
                    {item.ine_image_url && (
                      <div>
                        <p className="text-xs font-semibold mb-1">INE:</p>
                        <a href={item.ine_image_url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={item.ine_image_url || "/placeholder.svg"}
                            alt="Foto de INE"
                            width={100}
                            height={75}
                            className="rounded object-contain border"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                  {!item.license_plate_image_url && !item.ine_image_url && (
                    <p className="text-xs text-muted-foreground italic">Sin imágenes adicionales.</p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
