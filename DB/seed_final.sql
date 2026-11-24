USE YOLAVO;
-- 1. Usuarios del sistema (Admin y Operador de caja)
-- Contraseña para ambos: admin123
INSERT INTO users (full_name, email, phone, password_hash, role, active)
VALUES 
  ('Administrador YO LAVO', 'admin@yolavo.com', '70011111', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN', 1),
  ('Operador Caja', 'caja@yolavo.com', '70022222', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'STAFF', 1)
ON DUPLICATE KEY UPDATE email=email;
-- 2. Clientes de prueba para la lavandería
INSERT INTO customers (first_name, last_name, phone, address, email, active)
VALUES 
  ('Juan', 'Perez', '71234567', 'Calle Murillo #45', 'juan.perez@gmail.com', 1),
  ('Maria', 'Gomez', '72345678', 'Av. 6 de Agosto #890', 'maria.gomez@gmail.com', 1),
  ('Carlos', 'Mendoza', '73456789', 'Zona Central #32', 'carlos.m@gmail.com', 1)
ON DUPLICATE KEY UPDATE phone=phone;
