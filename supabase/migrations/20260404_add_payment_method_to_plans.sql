-- Agrega el campo payment_method a la tabla plans si aún no existe.
ALTER TABLE IF EXISTS plans
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'reserve';
