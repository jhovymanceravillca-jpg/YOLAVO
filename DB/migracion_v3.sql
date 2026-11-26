-- Ejecutar UNA sola vez, despues de migracion_v2.sql. No agrega datos de personas.
SET NAMES utf8mb4;
USE yo_lavo;

ALTER TABLE orders
  MODIFY status ENUM('RECIBIDO','ACEPTADO','RECOGIENDO','EN_LAVANDERIA','EN_PROCESO','TERMINADO',
                     'EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'RECIBIDO',
  MODIFY quote_type ENUM('por_kilo','por_prenda','fijo') NOT NULL DEFAULT 'por_kilo',
  MODIFY payment_method ENUM('qr','efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
  ADD COLUMN delivery_mode ENUM('domicilio','local') NOT NULL DEFAULT 'domicilio',
  ADD COLUMN service_id BIGINT UNSIGNED NULL,
  ADD COLUMN service_name VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN extras_names VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN extras_total DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN unit_price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN pickup_user_id BIGINT UNSIGNED NULL,
  ADD COLUMN pickup_reference VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN payment_note VARCHAR(120) NULL,
  ADD COLUMN rating TINYINT UNSIGNED NULL,
  ADD COLUMN review VARCHAR(255) NULL,
  ADD CONSTRAINT fk_orders_pickup FOREIGN KEY (pickup_user_id) REFERENCES users(id),
  ADD CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES services(id);

ALTER TABLE order_status_history
  MODIFY previous_status ENUM('RECIBIDO','ACEPTADO','RECOGIENDO','EN_LAVANDERIA','EN_PROCESO','TERMINADO',
                              'EN_CAMINO','ENTREGADO','CANCELADO') NULL,
  MODIFY new_status ENUM('RECIBIDO','ACEPTADO','RECOGIENDO','EN_LAVANDERIA','EN_PROCESO','TERMINADO',
                         'EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL;

ALTER TABLE laundry_shops ADD COLUMN qr_image MEDIUMTEXT NULL;
ALTER TABLE services ADD COLUMN is_extra BOOLEAN NOT NULL DEFAULT FALSE;

-- Tarifas del informe: kilo Bs 15, suavizante Bs 3,50 y expres Bs 10 (pruebas PF-06 a PF-08)
UPDATE services SET base_price = 15.00 WHERE name = 'Lavado por kilogramo';
INSERT IGNORE INTO services (name, description, unit_type, base_price, is_extra) VALUES
  ('Suavizante', 'Adicional', 'FIJO', 3.50, TRUE),
  ('Servicio exprés', 'Adicional', 'FIJO', 10.00, TRUE);

UPDATE orders SET unit_price = ROUND(total / quantity, 2) WHERE quantity > 0;
