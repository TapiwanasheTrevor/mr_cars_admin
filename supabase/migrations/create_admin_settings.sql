-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only admins can access settings
CREATE POLICY "Only admins can manage settings" ON admin_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Create trigger for updating timestamps
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', '"Mr Cars Admin"', 'string', 'Name of the admin site'),
('site_description', '"Comprehensive automotive marketplace administration"', 'string', 'Description of the admin site'),
('support_email', '"admin@mrcars.com"', 'string', 'Support email address'),
('max_listings_per_user', '10', 'number', 'Maximum number of listings per user'),
('enable_user_registration', 'true', 'boolean', 'Allow new user registrations'),
('enable_car_listings', 'true', 'boolean', 'Enable car listings feature'),
('enable_rental_listings', 'true', 'boolean', 'Enable rental listings feature'),
('enable_emergency_services', 'true', 'boolean', 'Enable emergency services feature'),
('enable_forum', 'true', 'boolean', 'Enable forum feature'),
('auto_approve_listings', 'false', 'boolean', 'Automatically approve new listings'),
('enable_email_notifications', 'true', 'boolean', 'Enable email notifications'),
('enable_push_notifications', 'true', 'boolean', 'Enable push notifications'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('maintenance_message', '"We are currently performing scheduled maintenance. Please check back shortly."', 'string', 'Message shown during maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE admin_settings IS 'System administration settings and configuration';