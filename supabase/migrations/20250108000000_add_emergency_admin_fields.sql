-- Add admin-specific columns to existing emergency_requests table
ALTER TABLE emergency_requests 
ADD COLUMN IF NOT EXISTS helper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS helper_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS estimated_arrival TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add email column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_emergency_requests_priority ON emergency_requests(priority);

-- Update sample data with correct structure (only add missing columns)
UPDATE emergency_requests 
SET priority = 'high', admin_response = NULL 
WHERE id = '550e8400-e29b-41d4-a716-446655440200' AND priority IS NULL;

UPDATE emergency_requests 
SET priority = 'medium', admin_response = 'Help is on the way. Our technician will arrive in 30 minutes.' 
WHERE id = '550e8400-e29b-41d4-a716-446655440201' AND priority IS NULL;

UPDATE emergency_requests 
SET priority = 'low', admin_response = 'Battery replacement service dispatched. ETA: 45 minutes.' 
WHERE id = '550e8400-e29b-41d4-a716-446655440202' AND priority IS NULL;

-- Insert sample emergency data if it doesn't exist (using only core columns that definitely exist)
INSERT INTO emergency_requests (
    id, user_id, vehicle_name, vehicle_year, fuel_type, issue_description, 
    location_lat, location_lng, location_text, status, created_at, updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440200',
    '550e8400-e29b-41d4-a716-446655440000',
    'Toyota Camry',
    2018,
    'Petrol',
    'Car broke down on highway. Engine overheating and making strange noises. Need immediate assistance.',
    25.276987,
    55.296249,
    'Sheikh Zayed Road, Near DIFC Metro Station',
    'pending',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440001',
    'Honda Civic',
    2020,
    'Petrol',
    'Flat tire on the side of the road. Need tire change assistance.',
    25.197197,
    55.274376,
    'Al Wasl Road, Near City Walk',
    'accepted',
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440002',
    'Nissan Altima',
    2019,
    'Petrol',
    'Battery dead, car will not start. Parked at mall parking lot.',
    25.118387,
    55.200372,
    'Mall of the Emirates Parking',
    'in_progress',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Update the records with new admin fields after they exist
UPDATE emergency_requests 
SET 
    priority = 'high'
WHERE id = '550e8400-e29b-41d4-a716-446655440200';

UPDATE emergency_requests 
SET 
    priority = 'medium',
    admin_response = 'Help is on the way. Our technician will arrive in 30 minutes.',
    estimated_arrival = '30 minutes',
    contact_phone = '+971-50-123-4567'
WHERE id = '550e8400-e29b-41d4-a716-446655440201';

UPDATE emergency_requests 
SET 
    priority = 'low',
    admin_response = 'Battery replacement service dispatched. ETA: 45 minutes.',
    estimated_arrival = '45 minutes',
    contact_phone = '+971-50-987-6543'
WHERE id = '550e8400-e29b-41d4-a716-446655440202';