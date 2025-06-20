import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await pool.query('UPDATE usuarios SET activo = FALSE WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
