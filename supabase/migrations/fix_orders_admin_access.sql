-- Fix admin access to orders table for dashboard statistics
-- This migration ensures admins can view all orders for statistics

-- Add admin policy for orders table if it doesn't exist
DO $$ 
BEGIN
    -- Check if admin policy exists for orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Admins can view all orders'
    ) THEN
        CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    -- Check if admin policy exists for order_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Admins can view all order items'
    ) THEN
        CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    -- Add admin management policies for tire_products
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tire_products' 
        AND policyname = 'Admins can manage all tire products'
    ) THEN
        CREATE POLICY "Admins can manage all tire products" ON tire_products FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    -- Add admin management policies for battery_products
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'battery_products' 
        AND policyname = 'Admins can manage all battery products'
    ) THEN
        CREATE POLICY "Admins can manage all battery products" ON battery_products FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

    -- Add admin management policies for cart_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cart_items' 
        AND policyname = 'Admins can view all cart items'
    ) THEN
        CREATE POLICY "Admins can view all cart items" ON cart_items FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the migration
        RAISE NOTICE 'Warning: Some policies could not be created: %', SQLERRM;
END $$;

COMMENT ON TABLE orders IS 'E-commerce orders table with admin access policies';
COMMENT ON TABLE order_items IS 'Individual items within orders with admin access policies';