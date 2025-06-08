-- Fix admin access to rental_listings table and related tables
-- This fixes the "Could not find a relationship between 'rental_listings' and 'profiles'" error

-- Create admin RLS policies for rental_listings
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rental_listings' 
        AND policyname = 'Admins can view all rental listings'
    ) THEN
        CREATE POLICY "Admins can view all rental listings" ON rental_listings 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rental_listings' 
        AND policyname = 'Admins can manage all rental listings'
    ) THEN
        CREATE POLICY "Admins can manage all rental listings" ON rental_listings 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for cars table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cars' 
        AND policyname = 'Admins can view all cars'
    ) THEN
        CREATE POLICY "Admins can view all cars" ON cars 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cars' 
        AND policyname = 'Admins can manage all cars'
    ) THEN
        CREATE POLICY "Admins can manage all cars" ON cars 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for inquiries table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inquiries' 
        AND policyname = 'Admins can view all inquiries'
    ) THEN
        CREATE POLICY "Admins can view all inquiries" ON inquiries 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inquiries' 
        AND policyname = 'Admins can manage all inquiries'
    ) THEN
        CREATE POLICY "Admins can manage all inquiries" ON inquiries 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for appointments table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Admins can view all appointments'
    ) THEN
        CREATE POLICY "Admins can view all appointments" ON appointments 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Admins can manage all appointments'
    ) THEN
        CREATE POLICY "Admins can manage all appointments" ON appointments 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for watchlist table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'watchlist' 
        AND policyname = 'Admins can view all watchlist items'
    ) THEN
        CREATE POLICY "Admins can view all watchlist items" ON watchlist 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'watchlist' 
        AND policyname = 'Admins can manage all watchlist items'
    ) THEN
        CREATE POLICY "Admins can manage all watchlist items" ON watchlist 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;