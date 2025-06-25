# arc3

## Cloud storage for entry photos

The upload API normally saves images under the `public/` folder. To store photos in Hostinger's object storage instead, create a bucket and note the endpoint URL, access key and secret key. When these environment variables are present the API will upload files using `@aws-sdk/client-s3`.

Environment variables you will need:

```
HOSTINGER_ENDPOINT=your-endpoint-url
HOSTINGER_BUCKET=your-bucket-name
HOSTINGER_ACCESS_KEY=your-access-key
HOSTINGER_SECRET_KEY=your-secret-key
```

When configured, the POST `/api/upload` route returns the cloud URL of the uploaded file. Use this URL when inserting records into the entry history table.

After cloning the repository run `npm install` so all dependencies (including the optional S3 client library) are available.

## Database configuration

The API connects to a MySQL database using the following environment variables:

```
DB_HOST=localhost
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
DB_PORT=3306
JWT_SECRET=your-jwt-secret
```

Entry records are stored in a table named `historial_entradas`. If you created
the project from scratch you may already have a simplified version of this
table, but the full schema used in production looks like this:

### Suggested tables

To keep track of uploads and allow runtime configuration, create these tables in your MySQL database:

```sql
-- System configuration table
CREATE TABLE configuracion_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Entry history table
CREATE TABLE historial_entradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ine TEXT NULL,
  tipo ENUM('residente','invitado','proveedor','otro') NOT NULL,
  vigilante_id INT NOT NULL,
  condominio_id INT NOT NULL,
  fecha_entrada TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP NULL DEFAULT NULL,
  placa_vehiculo TEXT NULL,
  scanned_at TEXT NULL,
  INDEX idx_historial_entradas_fecha (fecha_entrada)
);
```

The application writes a record to `historial_entradas` each time a QR code is
scanned from the vigilante dashboard. After uploading the INE and license plate
images the page sends a POST request to `/api/entry-history` with fields like:

```json
{
  "ine": "https://storage/ine.jpg",
  "tipo": "invitado",
  "vigilante_id": 12,
  "condominio_id": 5,
  "placa_vehiculo": "https://storage/placa.jpg",
  "scanned_at": "QR TEXT...",
  "fecha_entrada": "2025-06-24T12:34:56.000Z"
}
```

The server inserts these values into the table and returns `{ "success": true }`.
Adjust the insert logic if you store additional data.
