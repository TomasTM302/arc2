import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Faltan credenciales' },
      { status: 400 }
    )
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT 
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.fecha_registro,
        u.password_hash,
        r.nombre AS rol_nombre,
        p.numero AS casa_numero
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN usuario_propiedad up ON u.id = up.usuario_id
      LEFT JOIN propiedades p ON up.propiedad_id = p.id
      WHERE u.email = ? AND u.activo = TRUE
      LIMIT 1`,
      [email]
    )

    const user = rows[0]

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Correo o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return NextResponse.json(
        { success: false, message: 'Correo o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol_nombre },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id.toString(),
        firstName: user.nombre,
        lastName: user.apellido,
        email: user.email,
        phone: user.telefono,
        house: user.casa_numero || '',
        role: user.rol_nombre,
        createdAt: user.fecha_registro
      }
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
