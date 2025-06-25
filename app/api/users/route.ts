import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { appRoleFromDbRole, dbRoleFromAppRole } from '@/lib/roles'

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.fecha_registro,
        r.nombre AS rol_nombre,
        p.numero AS casa_numero,
        p.condominio_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN usuario_propiedad up ON u.id = up.usuario_id
      LEFT JOIN propiedades p ON up.propiedad_id = p.id
      WHERE u.activo = TRUE`
    )

    const users = rows.map((u: any) => ({
      id: u.id.toString(),
      firstName: u.nombre,
      lastName: u.apellido,
      email: u.email,
      phone: u.telefono,
      house: u.casa_numero || '',
      condominiumId: u.condominio_id ? u.condominio_id.toString() : '',
      role: appRoleFromDbRole(u.rol_nombre),
      createdAt: u.fecha_registro,
    }))

    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { firstName, lastName, email, phone, house, condominiumId, password, role } =
    await request.json()

  if (!firstName || !lastName || !email || !phone || !password || !role) {
    return NextResponse.json(
      { success: false, message: 'Faltan datos' },
      { status: 400 }
    )
  }

  try {
    const dbRole = dbRoleFromAppRole(role)
    let roleRows: any
    if (role === 'mantenimiento') {
      ;[roleRows] = await pool.query(
        'SELECT id FROM roles WHERE nombre IN (?, ?) LIMIT 1',
        ['Mantenimiento', 'Auxiliar']
      )
    } else {
      ;[roleRows] = await pool.query(
        'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
        [dbRole]
      )
    }
    if (roleRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Rol inválido' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol_id, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)',
      [firstName, lastName, email, phone, passwordHash, roleRows[0].id]
    )
    const userId = result.insertId

    if (house && condominiumId) {
      const [propRows]: any = await pool.query(
        'SELECT id FROM propiedades WHERE numero = ? AND condominio_id = ? LIMIT 1',
        [house, condominiumId]
      )
      if (propRows.length) {
        await pool.query(
          'INSERT INTO usuario_propiedad (usuario_id, propiedad_id) VALUES (?, ?)',
          [userId, propRows[0].id]
        )
      }
    }

    const user = {
      id: userId.toString(),
      firstName,
      lastName,
      email,
      phone,
      house,
      condominiumId: condominiumId || '',
      role,
      createdAt: new Date().toISOString(),
    }
    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
