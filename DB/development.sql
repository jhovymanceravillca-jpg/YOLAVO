USE yo_lavo;

INSERT IGNORE INTO garment_types (name, description) VALUES
  ('Camisa', 'Camisas y blusas'),
  ('Pantalón', 'Pantalones y jeans'),
  ('Chaqueta', 'Chaquetas y abrigos'),
  ('Ropa por kilo', 'Prendas cobradas por peso');

INSERT IGNORE INTO services (name, description, unit_type, base_price) VALUES
  ('Lavado', 'Lavado estándar', 'PRENDA', 5.00),
  ('Secado', 'Secado estándar', 'PRENDA', 4.00),
  ('Planchado', 'Planchado estándar', 'PRENDA', 5.00),
  ('Lavado y planchado', 'Lavado con planchado', 'PRENDA', 8.00),
  ('Limpieza especial', 'Limpieza de prendas delicadas', 'FIJO', 15.00),
  ('Lavado por kilogramo', 'Lavado de ropa por peso', 'KILOGRAMO', 10.00);
