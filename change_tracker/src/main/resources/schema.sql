ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS created_date TIMESTAMP;
ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP;
