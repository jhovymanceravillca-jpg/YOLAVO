# Yo Lavo - Como instalar y demostrar

## Base de datos (instalacion nueva, en este orden)
```bash
sudo mysql < DB/schema.sql
sudo mysql < DB/seed.sql
sudo mysql < DB/seed_final.sql
sudo mysql < DB/migracion_frontend.sql
sudo mysql < DB/migracion_v2.sql
sudo mysql < DB/migracion_v3.sql
```
Cada archivo se ejecuta una sola vez. Despues crear el usuario de la aplicacion:
```sql
CREATE USER 'yolavo_app'@'localhost' IDENTIFIED BY 'tu_clave';
GRANT SELECT, INSERT, UPDATE, DELETE ON yo_lavo.* TO 'yolavo_app'@'localhost';
```

## Ejecutar
Copiar `Backend/.env.example` como `Backend/.env` y completar los valores.
```bash
npm run instalar   # solo la primera vez
npm run dev        # backend (3001) y frontend (http://localhost:5173) juntos
```

## Cuentas de prueba (clave admin123, solo desarrollo)
| Rol | Correo |
|---|---|
| Cliente | cliente@yolavo.com |
| Lavanderia | caja@yolavo.com |
| Repartidor | delivery@yolavo.com |

## Recorrido de un pedido (3 pestanas nuevas, una cuenta en cada una)
1. Cliente: elige lavanderia, zona, direccion y referencia, y confirma.
2. Lavanderia: "Aceptar pedido".
3. Repartidor: "Aceptar carrera" (recojo) y "Deje la ropa en la lavanderia".
4. Lavanderia: confirma el peso real, lava y "Marcar como listo".
5. Repartidor: "Aceptar carrera" (entrega) y "Entregado y cobrado".
6. Cliente: ve el historial y califica.

## Abrir desde un celular (misma red Wi-Fi)
1. VirtualBox: Configuracion > Red > Adaptador puente.
2. En Ubuntu: `hostname -I` para ver la IP.
3. En el celular: `http://IP:5173`.
Las cuentas de prueba tienen clave conocida: usar solo en redes de confianza.

## Como esta conectado
React (5173) -> API Express (3001, token JWT) -> MySQL (yo_lavo)

No incluye: pasarela de pago, QR bancario, GPS en vivo, recuperacion de clave ni publicacion en internet.

## Arrancar todo
En la carpeta principal: `npm run dev` (backend y frontend juntos). Ctrl + C detiene ambos.
Primera vez en otra maquina: `npm run instalar`.

## Pagos
No hay pasarela bancaria. La lavanderia sube la imagen de su QR (Editar mi local), el cliente paga
desde su banco y avisa el numero de comprobante, y la lavanderia lo verifica y registra el pago.
