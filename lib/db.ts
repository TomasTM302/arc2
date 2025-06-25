import mysql from 'mysql2/promise'

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: environment variable ${key} is not set`)
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
})

export default pool
