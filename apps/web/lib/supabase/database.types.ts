export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_document_files: {
        Row: {id:string;user_id:string;conversation_id:string|null;name:string;storage_path:string;mime_type:string;size_bytes:number;created_at:string;expires_at:string}
        Insert: {id:string;user_id:string;conversation_id:string;name:string;storage_path:string;mime_type:string;size_bytes:number;created_at?:string;expires_at?:string}
        Update: {id?:string;user_id?:string;conversation_id?:string|null;name?:string;storage_path?:string;mime_type?:string;size_bytes?:number;created_at?:string;expires_at?:string}
        Relationships: [{foreignKeyName:"ai_document_files_conversation_id_fkey";columns:["conversation_id"];isOneToOne:false;referencedRelation:"ai_conversations";referencedColumns:["id"]}]
      }

      ai_attachments: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          mime_type: string
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          mime_type: string
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          pinned: boolean
          selected_model: string
          temporary: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          pinned?: boolean
          selected_model?: string
          temporary?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          pinned?: boolean
          selected_model?: string
          temporary?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          model: string | null
          role: string
          status: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role: string
          status?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_receipts: {
        Row: {
          created_at: string
          payload_hash: string
          request_id: string
          response: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          payload_hash: string
          request_id: string
          response?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          payload_hash?: string
          request_id?: string
          response?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          capability: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          capability: string
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          capability?: string
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_items: {
        Row: {
          assignment_id: string
          position: number
          question_id: string
        }
        Insert: {
          assignment_id: string
          position: number
          question_id: string
        }
        Update: {
          assignment_id?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_items_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          id: string
          metadata: Json
          score: number | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          id?: string
          metadata?: Json
          score?: number | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          id?: string
          metadata?: Json
          score?: number | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          due_at: string | null
          id: string
          instructions: string
          published_at: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          due_at?: string | null
          id?: string
          instructions?: string
          published_at?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          id?: string
          instructions?: string
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          assisted: boolean
          correct: boolean
          created_at: string
          evidence_weight: number
          id: string
          idempotency_key: string
          practice_repeat: boolean
          question_id: string
          response: Json
          user_id: string
        }
        Insert: {
          assisted?: boolean
          correct: boolean
          created_at?: string
          evidence_weight?: number
          id?: string
          idempotency_key: string
          practice_repeat?: boolean
          question_id: string
          response: Json
          user_id: string
        }
        Update: {
          assisted?: boolean
          correct?: boolean
          created_at?: string
          evidence_weight?: number
          id?: string
          idempotency_key?: string
          practice_repeat?: boolean
          question_id?: string
          response?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_runs: {
        Row: {
          completed_at: string
          id: string
          question_ids: string[]
          score: number
          unit_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          question_ids?: string[]
          score: number
          unit_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          question_ids?: string[]
          score?: number
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_runs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_memberships: {
        Row: {
          class_id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_memberships_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          active: boolean
          created_at: string
          grade_label: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          academic_year: string
          active?: boolean
          created_at?: string
          grade_label: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          academic_year?: string
          active?: boolean
          created_at?: string
          grade_label?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          active: boolean
          created_at: string
          description_ar: string
          description_en: string
          id: string
          metadata: Json
          slug: string
          title_ar: string
          title_en: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          metadata?: Json
          slug: string
          title_ar: string
          title_en: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          metadata?: Json
          slug?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      equipped_cosmetics: {
        Row: {
          item_id: string
          slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          item_id: string
          slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          item_id?: string
          slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipped_cosmetics_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipped_cosmetics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          acquired_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          idempotency_key: string
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          best_score: number
          completed_at: string | null
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          completed_at?: string | null
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed_at?: string | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          coin_reward: number
          content: Json
          id: string
          position: number
          slug: string
          title_ar: string
          title_en: string
          unit_id: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          content?: Json
          id?: string
          position: number
          slug: string
          title_ar: string
          title_en: string
          unit_id: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          content?: Json
          id?: string
          position?: number
          slug?: string
          title_ar?: string
          title_en?: string
          unit_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_runs: {
        Row: {
          completed_at: string | null
          completed_question_ids: string[]
          id: string
          lesson_id: string | null
          question_ids: string[]
          skill_id: string | null
          source: string
          stage: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_question_ids?: string[]
          id?: string
          lesson_id?: string | null
          question_ids?: string[]
          skill_id?: string | null
          source?: string
          stage?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_question_ids?: string[]
          id?: string
          lesson_id?: string | null
          question_ids?: string[]
          skill_id?: string | null
          source?: string
          stage?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_runs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_runs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string
          id: string
          last_learning_day: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["noata_role"]
          streak_days: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          id: string
          last_learning_day?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["noata_role"]
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          id?: string
          last_learning_day?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["noata_role"]
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          item_id: string
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          item_id: string
          price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          item_id?: string
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_keys: {
        Row: {
          answer_spec: Json
          explanation_ar: string
          explanation_en: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_spec: Json
          explanation_ar?: string
          explanation_en?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_spec?: Json
          explanation_ar?: string
          explanation_en?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices_ar: Json
          choices_en: Json
          created_at: string
          created_by: string | null
          difficulty: number
          id: string
          lesson_id: string | null
          metadata: Json
          position: number | null
          prompt_ar: string
          prompt_en: string
          publication_status: Database["public"]["Enums"]["question_publication_status"]
          question_type: string
          review_status: Database["public"]["Enums"]["question_review_status"]
          skill_id: string | null
          unit_id: string | null
          variant_of: string | null
        }
        Insert: {
          choices_ar?: Json
          choices_en?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: number
          id?: string
          lesson_id?: string | null
          metadata?: Json
          position?: number | null
          prompt_ar: string
          prompt_en: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question_type?: string
          review_status?: Database["public"]["Enums"]["question_review_status"]
          skill_id?: string | null
          unit_id?: string | null
          variant_of?: string | null
        }
        Update: {
          choices_ar?: Json
          choices_en?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: number
          id?: string
          lesson_id?: string | null
          metadata?: Json
          position?: number | null
          prompt_ar?: string
          prompt_en?: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question_type?: string
          review_status?: Database["public"]["Enums"]["question_review_status"]
          skill_id?: string | null
          unit_id?: string | null
          variant_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_variant_of_fkey"
            columns: ["variant_of"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_boxes: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          idempotency_key: string
          reward: Json | null
          source: string
          source_ref: string | null
          tier: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key: string
          reward?: Json | null
          source: string
          source_ref?: string | null
          tier?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string
          reward?: Json | null
          source?: string
          source_ref?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_boxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          active: boolean
          asset_url: string | null
          id: string
          item_type: string
          price: number
          slug: string
          title_ar: string
          title_en: string
        }
        Insert: {
          active?: boolean
          asset_url?: string | null
          id?: string
          item_type: string
          price: number
          slug: string
          title_ar: string
          title_en: string
        }
        Update: {
          active?: boolean
          asset_url?: string | null
          id?: string
          item_type?: string
          price?: number
          slug?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      skill_evidence: {
        Row: {
          independent_distinct_count: number
          mastery_score: number
          next_review_at: string | null
          skill_id: string
          state: Database["public"]["Enums"]["mastery_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          independent_distinct_count?: number
          mastery_score?: number
          next_review_at?: string | null
          skill_id: string
          state?: Database["public"]["Enums"]["mastery_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          independent_distinct_count?: number
          mastery_score?: number
          next_review_at?: string | null
          skill_id?: string
          state?: Database["public"]["Enums"]["mastery_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_evidence_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          course_id: string
          id: string
          slug: string
          title_ar: string
          title_en: string
        }
        Insert: {
          course_id: string
          id?: string
          slug: string
          title_ar: string
          title_en: string
        }
        Update: {
          course_id?: string
          id?: string
          slug?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_class_access: {
        Row: {
          class_id: string
          created_at: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_access_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_access_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          boss_enabled: boolean
          course_id: string
          description_ar: string
          description_en: string
          id: string
          metadata: Json
          position: number
          title_ar: string
          title_en: string
        }
        Insert: {
          boss_enabled?: boolean
          course_id: string
          description_ar?: string
          description_en?: string
          id?: string
          metadata?: Json
          position: number
          title_ar: string
          title_en: string
        }
        Update: {
          boss_enabled?: boolean
          course_id?: string
          description_ar?: string
          description_en?: string
          id?: string
          metadata?: Json
          position?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_memory_enabled: boolean
          created_at: string
          default_ai_model: string
          locale: string
          palette: string | null
          reduced_motion: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_memory_enabled?: boolean
          created_at?: string
          default_ai_model?: string
          locale?: string
          palette?: string | null
          reduced_motion?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_memory_enabled?: boolean
          created_at?: string
          default_ai_model?: string
          locale?: string
          palette?: string | null
          reduced_motion?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_ai_usage_summary: {
        Args: never
        Returns: {
          attempts: number
          capability: string
        }[]
      }
      claim_ai_quota: {
        Args: {
          p_capability: string
          p_limit: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      claim_reward_box: { Args: { p_box_id: string }; Returns: Json }
      complete_lesson: {
        Args: { p_lesson_id: string; p_score: number }
        Returns: Json
      }
      complete_unit_boss: {
        Args: { p_question_ids: string[]; p_unit_id: string }
        Returns: Json
      }
      create_question_draft: {
        Args: {
          p_answer_spec: Json
          p_choices_ar: Json
          p_choices_en: Json
          p_difficulty: number
          p_explanation_ar: string
          p_explanation_en: string
          p_lesson_id: string
          p_metadata?: Json
          p_prompt_ar: string
          p_prompt_en: string
          p_question_type: string
          p_skill_id: string
          p_unit_id: string
        }
        Returns: string
      }
      equip_cosmetic: { Args: { p_item_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      purchase_shop_item: {
        Args: { p_idempotency_key: string; p_item_id: string }
        Returns: Json
      }
      set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["noata_role"]
          p_user_id: string
        }
        Returns: Json
      }
      submit_attempt: {
        Args: {
          p_assisted: boolean
          p_idempotency_key: string
          p_practice_repeat?: boolean
          p_question_id: string
          p_response: Json
        }
        Returns: Json
      }
      transition_question: {
        Args: { p_action: string; p_question_id: string }
        Returns: Json
      }
    }
    Enums: {
      mastery_state:
        | "new"
        | "reteach"
        | "supported"
        | "mixed"
        | "provisional_mastery"
        | "mastered"
      noata_role: "student" | "teacher" | "admin"
      question_publication_status:
        | "draft"
        | "published_demo"
        | "published"
        | "retired"
      question_review_status: "draft" | "in_review" | "approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mastery_state: [
        "new",
        "reteach",
        "supported",
        "mixed",
        "provisional_mastery",
        "mastered",
      ],
      noata_role: ["student", "teacher", "admin"],
      question_publication_status: [
        "draft",
        "published_demo",
        "published",
        "retired",
      ],
      question_review_status: ["draft", "in_review", "approved"],
    },
  },
} as const

