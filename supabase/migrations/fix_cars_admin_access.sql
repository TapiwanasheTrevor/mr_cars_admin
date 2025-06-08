-- Fix admin access to cars table specifically
-- This ensures admins can view all car listings

-- Enable RLS on cars table if not already enabled
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all cars" ON cars;
DROP POLICY IF EXISTS "Admins can manage all cars" ON cars;

-- Create admin RLS policies for cars table
CREATE POLICY "Admins can view all cars" ON cars 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can manage all cars" ON cars 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Also ensure public can view cars (for regular app functionality)
DROP POLICY IF EXISTS "Cars are viewable by everyone" ON cars;
CREATE POLICY "Cars are viewable by everyone" ON cars FOR SELECT USING (true);

-- Allow car owners to manage their own cars
DROP POLICY IF EXISTS "Users can manage their own cars" ON cars;
CREATE POLICY "Users can manage their own cars" ON cars 
FOR ALL USING (auth.uid() = seller_id);