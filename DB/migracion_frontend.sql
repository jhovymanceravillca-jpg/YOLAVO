-- Ejecutar UNA sola vez, despues de schema.sql, seed.sql y seed_final.sql
USE yo_lavo;

ALTER TABLE users
  ADD COLUMN username VARCHAR(60) NULL UNIQUE,
  ADD COLUMN address VARCHAR(255) NULL,
  MODIFY role ENUM('ADMIN','STAFF','CLIENT','DELIVERY') NOT NULL DEFAULT 'CLIENT';

ALTER TABLE customers
  ADD COLUMN user_id BIGINT UNSIGNED NULL UNIQUE,
  ADD CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE laundry_shops
  ADD COLUMN owner_id BIGINT UNSIGNED NULL,
  ADD COLUMN district VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN reviews_count INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN available_washers INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN icon VARCHAR(16) NOT NULL DEFAULT '🧺',
  ADD COLUMN delivery_time VARCHAR(40) NOT NULL DEFAULT '30-45 min',
  ADD CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE orders
  ADD COLUMN shop_id BIGINT UNSIGNED NULL,
  ADD COLUMN delivery_user_id BIGINT UNSIGNED NULL,
  ADD COLUMN quote_type ENUM('por_kilo','por_prenda') NOT NULL DEFAULT 'por_kilo',
  ADD COLUMN quantity DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN payment_method ENUM('qr','efectivo','tarjeta') NOT NULL DEFAULT 'efectivo',
  ADD COLUMN pickup_address VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN delivery_address VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY status ENUM('RECIBIDO','EN_PROCESO','TERMINADO','EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'RECIBIDO',
  ADD CONSTRAINT fk_orders_shop FOREIGN KEY (shop_id) REFERENCES laundry_shops(id),
  ADD CONSTRAINT fk_orders_delivery FOREIGN KEY (delivery_user_id) REFERENCES users(id);

ALTER TABLE order_status_history
  MODIFY previous_status ENUM('RECIBIDO','EN_PROCESO','TERMINADO','EN_CAMINO','ENTREGADO','CANCELADO') NULL,
  MODIFY new_status ENUM('RECIBIDO','EN_PROCESO','TERMINADO','EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL;

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(40) NOT NULL,
  price DECIMAL(10,2) UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  icon VARCHAR(16) NOT NULL DEFAULT '🧴',
  CONSTRAINT fk_products_shop FOREIGN KEY (shop_id) REFERENCES laundry_shops(id)
) ENGINE=InnoDB;

-- Datos de prueba. Contrasena de las cuentas: admin123 (solo para desarrollo)
UPDATE users SET password_hash='$2b$10$03oY0ENAcFjefeo/tZHcfOkXmTxVWCgK7OiQMoXtdK3tdHkqT.GIW' WHERE email IN ('admin@yolavo.com','caja@yolavo.com');
INSERT INTO users (full_name,email,username,password_hash,role) VALUES
  ('Cliente Prueba','cliente@yolavo.com','cliente','$2b$10$03oY0ENAcFjefeo/tZHcfOkXmTxVWCgK7OiQMoXtdK3tdHkqT.GIW','CLIENT'),
  ('Delivery Prueba','delivery@yolavo.com','delivery','$2b$10$03oY0ENAcFjefeo/tZHcfOkXmTxVWCgK7OiQMoXtdK3tdHkqT.GIW','DELIVERY');

INSERT INTO laundry_shops (name,address,latitude,longitude,services_summary,owner_id,district,price_per_kg,available_washers)
SELECT 'Yo Lavo Central','Calle Murillo 45',-16.4955000,-68.1336000,'Por Kilo,Secado Express',id,'Centro',10.00,4
FROM users WHERE email='caja@yolavo.com';
SET @shop = LAST_INSERT_ID();

INSERT INTO products (shop_id,name,type,price,stock) VALUES (@shop,'Detergente liquido','detergente',28.50,45);

INSERT INTO customers (first_name,last_name,phone,address,email,user_id)
SELECT 'Cliente','Prueba','70000000','Av. Prueba 1',email,id FROM users WHERE email='cliente@yolavo.com';
SET @cust = LAST_INSERT_ID();

INSERT INTO orders (order_code,customer_id,created_by,expected_delivery_at,subtotal,total,shop_id,delivery_user_id,quantity,pickup_address,delivery_address,status)
SELECT 'YL-PRUEBA-1',@cust,c.id,NOW() + INTERVAL 1 DAY,40,40,@shop,d.id,4,'Av. Prueba 1','Av. Prueba 1','EN_CAMINO'
FROM users c JOIN users d ON d.email='delivery@yolavo.com' WHERE c.email='cliente@yolavo.com';
