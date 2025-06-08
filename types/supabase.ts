export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'super_admin' | 'moderator' | 'support';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'moderator' | 'support';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'moderator' | 'support';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cars: {
        Row: {
          id: string;
          make: string;
          model: string;
          year: number;
          price: number;
          mileage: number;
          fuel_type: string;
          transmission: string;
          description: string;
          location: string;
          seller_id: string;
          is_active: boolean;
          classification: string;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          make: string;
          model: string;
          year: number;
          price: number;
          mileage: number;
          fuel_type: string;
          transmission: string;
          description: string;
          location: string;
          seller_id: string;
          is_active?: boolean;
          classification: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          make?: string;
          model?: string;
          year?: number;
          price?: number;
          mileage?: number;
          fuel_type?: string;
          transmission?: string;
          description?: string;
          location?: string;
          seller_id?: string;
          is_active?: boolean;
          classification?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          phone: string;
          profile_picture_url: string | null;
          role: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          username: string;
          phone: string;
          profile_picture_url?: string | null;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          phone?: string;
          profile_picture_url?: string | null;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: string;
          payment_method: string;
          payment_status: string;
          shipping_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_amount: number;
          status?: string;
          payment_method: string;
          payment_status?: string;
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_amount?: number;
          status?: string;
          payment_method?: string;
          payment_status?: string;
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_type: string;
          product_name: string;
          price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_type: string;
          product_name: string;
          price: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_type?: string;
          product_name?: string;
          price?: number;
          quantity?: number;
          created_at?: string;
        };
      };
      inquiries: {
        Row: {
          id: string;
          car_id: string;
          inquirer_id: string;
          seller_id: string;
          message: string;
          phone_number: string | null;
          email: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          inquirer_id: string;
          seller_id: string;
          message: string;
          phone_number?: string | null;
          email?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          inquirer_id?: string;
          seller_id?: string;
          message?: string;
          phone_number?: string | null;
          email?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tire_products: {
        Row: {
          id: string;
          name: string;
          brand: string;
          size: string | null;
          price: number;
          rating: number;
          sales_count: number;
          description: string | null;
          image_url: string | null;
          in_stock: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          size?: string | null;
          price: number;
          rating?: number;
          sales_count?: number;
          description?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          size?: string | null;
          price?: number;
          rating?: number;
          sales_count?: number;
          description?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      battery_products: {
        Row: {
          id: string;
          name: string;
          brand: string;
          type: string | null;
          cca: number | null;
          price: number;
          rating: number;
          sales_count: number;
          description: string | null;
          image_url: string | null;
          in_stock: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          type?: string | null;
          cca?: number | null;
          price: number;
          rating?: number;
          sales_count?: number;
          description?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          type?: string | null;
          cca?: number | null;
          price?: number;
          rating?: number;
          sales_count?: number;
          description?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'inquiry' | 'appointment' | 'system' | 'promotion' | 'order';
          read: boolean;
          data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'inquiry' | 'appointment' | 'system' | 'promotion' | 'order';
          read?: boolean;
          data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'inquiry' | 'appointment' | 'system' | 'promotion' | 'order';
          read?: boolean;
          data?: any;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          car_id: string;
          user_id: string;
          date: string;
          time: string;
          status: 'scheduled' | 'completed' | 'cancelled';
          notes: string | null;
          service_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          user_id: string;
          date: string;
          time: string;
          status?: 'scheduled' | 'completed' | 'cancelled';
          notes?: string | null;
          service_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          user_id?: string;
          date?: string;
          time?: string;
          status?: 'scheduled' | 'completed' | 'cancelled';
          notes?: string | null;
          service_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          setting_type: 'string' | 'number' | 'boolean' | 'json';
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: any;
          setting_type: 'string' | 'number' | 'boolean' | 'json';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: any;
          setting_type?: 'string' | 'number' | 'boolean' | 'json';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      forum_topics: {
        Row: {
          id: string;
          title: string;
          content: string;
          user_id: string;
          author_name: string | null;
          category: string;
          likes: number;
          comments: number;
          created_at: string;
          updated_at: string;
          is_pinned: boolean | null;
          is_locked: boolean | null;
          views_count: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          user_id: string;
          author_name?: string | null;
          category?: string;
          likes?: number;
          comments?: number;
          created_at?: string;
          updated_at?: string;
          is_pinned?: boolean | null;
          is_locked?: boolean | null;
          views_count?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          user_id?: string;
          author_name?: string | null;
          category?: string;
          likes?: number;
          comments?: number;
          created_at?: string;
          updated_at?: string;
          is_pinned?: boolean | null;
          is_locked?: boolean | null;
          views_count?: number | null;
        };
      };
      forum_replies: {
        Row: {
          id: string;
          topic_id: string;
          content: string;
          user_id: string;
          author_name: string | null;
          likes: number;
          dislikes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          content: string;
          user_id: string;
          author_name?: string | null;
          likes?: number;
          dislikes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          content?: string;
          user_id?: string;
          author_name?: string | null;
          likes?: number;
          dislikes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}