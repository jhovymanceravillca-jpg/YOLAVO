-- Ejecutar UNA sola vez, despues de migracion_frontend.sql
SET NAMES utf8mb4;
USE yo_lavo;

ALTER TABLE orders
  ADD COLUMN delivery_fee DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 8.00;

CREATE TABLE machines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  type ENUM('lavadora','secadora') NOT NULL,
  capacity_kg INT UNSIGNED NOT NULL,
  status ENUM('disponible','ocupada','mantenimiento') NOT NULL DEFAULT 'disponible',
  ends_at DATETIME NULL,
  UNIQUE KEY uq_machine (shop_id, code),
  CONSTRAINT fk_machines_shop FOREIGN KEY (shop_id) REFERENCES laundry_shops(id)
) ENGINE=InnoDB;

INSERT INTO machines (shop_id, code, type, capacity_kg)
SELECT id, 'LAV-01', 'lavadora', 15 FROM laundry_shops
UNION ALL SELECT id, 'LAV-02', 'lavadora', 20 FROM laundry_shops
UNION ALL SELECT id, 'SEC-01', 'secadora', 18 FROM laundry_shops;

-- Corrige los iconos y adapta los datos de prueba
UPDATE laundry_shops SET icon = '🧺';
UPDATE products SET icon = '🧴', name = 'Detergente líquido';
UPDATE users SET phone = '70000001' WHERE email = 'cliente@yolavo.com';
UPDATE users SET address = 'Av. 6 de Agosto 890, La Paz' WHERE email = 'cliente@yolavo.com';
UPDATE users SET phone = '70000002' WHERE email = 'delivery@yolavo.com';
