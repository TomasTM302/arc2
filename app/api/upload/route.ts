import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const dir = join(process.cwd(), 'public', folder)
  await fs.mkdir(dir, { recursive: true })
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
  const filePath = join(dir, fileName)
  await fs.writeFile(filePath, buffer)
  const url = `/${folder}/${fileName}`
  return NextResponse.json({ success: true, url })
}
