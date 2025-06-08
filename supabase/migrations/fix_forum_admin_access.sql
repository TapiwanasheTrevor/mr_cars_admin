-- Fix admin access to forum tables for moderation
-- This ensures admins can manage all forum content

-- Create admin RLS policies for forum_topics
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'forum_topics' 
        AND policyname = 'Admins can manage all forum topics'
    ) THEN
        CREATE POLICY "Admins can manage all forum topics" ON forum_topics 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for forum_replies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'forum_replies' 
        AND policyname = 'Admins can manage all forum replies'
    ) THEN
        CREATE POLICY "Admins can manage all forum replies" ON forum_replies 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for post_likes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_likes' 
        AND policyname = 'Admins can manage all post likes'
    ) THEN
        CREATE POLICY "Admins can manage all post likes" ON post_likes 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for comment_likes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Admins can manage all comment likes'
    ) THEN
        CREATE POLICY "Admins can manage all comment likes" ON comment_likes 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for comment_dislikes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_dislikes' 
        AND policyname = 'Admins can manage all comment dislikes'
    ) THEN
        CREATE POLICY "Admins can manage all comment dislikes" ON comment_dislikes 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- Create admin RLS policies for forum_categories if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_categories') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'forum_categories' 
            AND policyname = 'Admins can manage all forum categories'
        ) THEN
            CREATE POLICY "Admins can manage all forum categories" ON forum_categories 
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
        END IF;
    END IF;
END $$;