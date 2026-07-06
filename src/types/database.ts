export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      customer_orders: {
        Row: {
          customer_id: string;
          date: string;
          id: string;
          items: Json;
          organization_id: string;
          status: string;
          total: number;
        };
        Insert: {
          customer_id: string;
          date: string;
          id?: string;
          items?: Json;
          organization_id: string;
          status?: string;
          total?: number;
        };
        Update: {
          customer_id?: string;
          date?: string;
          id?: string;
          items?: Json;
          organization_id?: string;
          status?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          email: string;
          favorite_items: string[];
          id: string;
          join_date: string;
          loyalty_points: number;
          name: string;
          organization_id: string;
          phone: string;
          tags: string[];
          tier: string;
        };
        Insert: {
          email?: string;
          favorite_items?: string[];
          id?: string;
          join_date?: string;
          loyalty_points?: number;
          name: string;
          organization_id: string;
          phone?: string;
          tags?: string[];
          tier?: string;
        };
        Update: {
          email?: string;
          favorite_items?: string[];
          id?: string;
          join_date?: string;
          loyalty_points?: number;
          name?: string;
          organization_id?: string;
          phone?: string;
          tags?: string[];
          tier?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback_records: {
        Row: {
          comment: string;
          customer_id: string;
          date: string;
          id: string;
          order_id: string | null;
          organization_id: string;
          rating: number;
        };
        Insert: {
          comment?: string;
          customer_id: string;
          date: string;
          id?: string;
          order_id?: string | null;
          organization_id: string;
          rating: number;
        };
        Update: {
          comment?: string;
          customer_id?: string;
          date?: string;
          id?: string;
          order_id?: string | null;
          organization_id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_records_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_records_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "customer_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          par: number;
          quantity: number;
          reorder_point: number;
          supplier_id: string | null;
          unit: string;
          unit_cost: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          par?: number;
          quantity?: number;
          reorder_point?: number;
          supplier_id?: string | null;
          unit: string;
          unit_cost?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          par?: number;
          quantity?: number;
          reorder_point?: number;
          supplier_id?: string | null;
          unit?: string;
          unit_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          accent_color: string;
          avatar_url: string | null;
          bio: string;
          created_at: string;
          email: string;
          id: string;
          name: string;
          organization_id: string;
          phone: string;
          provider: string;
          role: string;
          theme: string;
        };
        Insert: {
          accent_color?: string;
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          email: string;
          id: string;
          name: string;
          organization_id: string;
          phone?: string;
          provider?: string;
          role: string;
          theme?: string;
        };
        Update: {
          accent_color?: string;
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          phone?: string;
          provider?: string;
          role?: string;
          theme?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          description: string;
          discount: string;
          expires_on: string | null;
          id: string;
          linked_inventory_item_id: string | null;
          linked_menu_items: string[];
          organization_id: string;
          reason: string;
          status: string;
          target_customer_ids: string[];
          target_tiers: string[];
          title: string;
        };
        Insert: {
          description?: string;
          discount?: string;
          expires_on?: string | null;
          id?: string;
          linked_inventory_item_id?: string | null;
          linked_menu_items?: string[];
          organization_id: string;
          reason?: string;
          status?: string;
          target_customer_ids?: string[];
          target_tiers?: string[];
          title: string;
        };
        Update: {
          description?: string;
          discount?: string;
          expires_on?: string | null;
          id?: string;
          linked_inventory_item_id?: string | null;
          linked_menu_items?: string[];
          organization_id?: string;
          reason?: string;
          status?: string;
          target_customer_ids?: string[];
          target_tiers?: string[];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_linked_inventory_item_id_fkey";
            columns: ["linked_inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_records: {
        Row: {
          date: string;
          delivered: boolean;
          expected_delivery: string;
          id: string;
          item_id: string;
          organization_id: string;
          quantity: number;
          supplier_id: string | null;
          unit_price: number;
        };
        Insert: {
          date: string;
          delivered?: boolean;
          expected_delivery: string;
          id?: string;
          item_id: string;
          organization_id: string;
          quantity: number;
          supplier_id?: string | null;
          unit_price: number;
        };
        Update: {
          date?: string;
          delivered?: boolean;
          expected_delivery?: string;
          id?: string;
          item_id?: string;
          organization_id?: string;
          quantity?: number;
          supplier_id?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_records_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_records_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          categories: string[];
          contact: string;
          id: string;
          last_delivery: string | null;
          name: string;
          on_time_rate: number;
          organization_id: string;
          phone: string;
          rating: number;
          status: string;
        };
        Insert: {
          categories?: string[];
          contact?: string;
          id?: string;
          last_delivery?: string | null;
          name: string;
          on_time_rate?: number;
          organization_id: string;
          phone?: string;
          rating?: number;
          status?: string;
        };
        Update: {
          categories?: string[];
          contact?: string;
          id?: string;
          last_delivery?: string | null;
          name?: string;
          on_time_rate?: number;
          organization_id?: string;
          phone?: string;
          rating?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_account: {
        Args: {
          p_org_name: string;
          p_role: string;
          p_seed_demo?: boolean;
          p_user_name: string;
        };
        Returns: string;
      };
      current_org_id: { Args: Record<string, never>; Returns: string };
      seed_demo_data: { Args: { p_org_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
