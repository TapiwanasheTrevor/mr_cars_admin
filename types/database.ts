export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          make: string
          model: string
          year: number
          price: number
          classification: string
          mileage: number
          transmission: string
          fuel_type: string
          images: string[]
          seller_id: string
          seller_name: string | null
          seller_rating: number | null
          specifications: Record<string, any>
          features: string[]
          seller_notes: string | null
          body_type: string | null
          color: string | null
          date_added: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          make: string
          model: string
          year: number
          price: number
          classification: string
          mileage: number
          transmission: string
          fuel_type: string
          images?: string[]
          seller_id: string
          seller_name?: string | null
          seller_rating?: number | null
          specifications?: Record<string, any>
          features?: string[]
          seller_notes?: string | null
          body_type?: string | null
          color?: string | null
          date_added?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year?: number
          price?: number
          classification?: string
          mileage?: number
          transmission?: string
          fuel_type?: string
          images?: string[]
          seller_id?: string
          seller_name?: string | null
          seller_rating?: number | null
          specifications?: Record<string, any>
          features?: string[]
          seller_notes?: string | null
          body_type?: string | null
          color?: string | null
          date_added?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string | null
          email: string | null
          phone: string | null
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          phone: string | null
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          phone?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          phone?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_listings: {
        Row: {
          id: string
          make: string
          model: string
          year: number
          price_per_day: number
          availability_status: string
          images: string[]
          owner_id: string
          location: string | null
          features: string[]
          description: string | null
          min_rental_days: number
          max_rental_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          make: string
          model: string
          year: number
          price_per_day: number
          availability_status?: string
          images?: string[]
          owner_id: string
          location?: string | null
          features?: string[]
          description?: string | null
          min_rental_days?: number
          max_rental_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year?: number
          price_per_day?: number
          availability_status?: string
          images?: string[]
          owner_id?: string
          location?: string | null
          features?: string[]
          description?: string | null
          min_rental_days?: number
          max_rental_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          car_id: string
          user_id: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          car_id: string
          user_id: string
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          user_id?: string
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          car_id: string
          user_id: string
          date: string
          time: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          car_id: string
          user_id: string
          date: string
          time: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          user_id?: string
          date?: string
          time?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}