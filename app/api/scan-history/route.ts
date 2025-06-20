import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, scanned_at, qr_data, license_plate_image_url, ine_image_url FROM qr_scan_history ORDER BY scanned_at DESC LIMIT 100',
    ) as any[]
    return NextResponse.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await pool.execute(
      'INSERT INTO qr_scan_history (qr_data, license_plate_image_url, ine_image_url) VALUES (?, ?, ?)',
      [body.qr_data, body.license_plate_image_url, body.ine_image_url],
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await pool.execute('DELETE FROM qr_scan_history')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
