# Yo Lavo - Como instalar y demostrar

## Base de datos (instalacion nueva, en este orden)
```bash
sudo mysql < DB/schema.sql
sudo mysql < DB/seed.sql
sudo mysql < DB/seed_final.sql
sudo mysql < DB/migracion_frontend.sql
sudo mysql < DB/migracion_v2.sql
```
Cada archivo se ejecuta una sola vez. Despues crear el usuario de la aplicacion:
```sql
CREATE USER 'yolavo_app'@'localhost' IDENTIFIED BY 'tu_clave';
GRANT SELECT, INSERT, UPDATE, DELETE ON yo_lavo.* TO 'yolavo_app'@'localhost';
```

## Ejecutar
Copiar `Backend/.env.example` como `Backend/.env` y completar los valores.
```bash
cd Backend && npm install && npm run dev     # terminal 1, puerto 3001
cd FrontEnd && npm install && npm run dev    # terminal 2, http://localhost:5173
```

## Cuentas de prueba (clave admin123, solo desarrollo)
| Rol | Correo |
|---|---|
| Cliente | cliente@yolavo.com |
| Lavanderia | caja@yolavo.com |
| Repartidor | delivery@yolavo.com |

## Demostracion (3 pestanas nuevas, una cuenta en cada una)
1. Cliente: "Cotizar y pedir" y confirmar.
2. Lavanderia: "Aceptar y lavar" y luego "Marcar como listo".
3. Repartidor: "Aceptar carrera" y luego "Entregado".
4. Cliente: el pedido figura como Entregado. Lavanderia: suben los ingresos.

## Como esta conectado
React (5173) -> API Express (3001, token JWT) -> MySQL (yo_lavo)

No incluye: pasarela de pago real, QR bancario ni GPS en vivo. El pago se cobra al entregar.
