import type { Metadata } from "next"
import type React from "react"
import VigilanteLayoutClient from "./VigilanteLayoutClient"

export const metadata: Metadata = {
  title: "Vigilante | ARC",
  description: "Panel de vigilante para ARC",
}

export default function VigilanteLayout({ children }: { children: React.ReactNode }) {
  return <VigilanteLayoutClient children={children} />
}
