export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      video_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          aspect_ratio: string
          voice_id: string | null
          music_prompt: string | null
          status: string
          final_video_url: string | null
          total_duration: number
          total_credits_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          aspect_ratio: string
          voice_id?: string | null
          music_prompt?: string | null
          status?: string
          final_video_url?: string | null
          total_duration?: number
          total_credits_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          aspect_ratio?: string
          voice_id?: string | null
          music_prompt?: string | null
          status?: string
          final_video_url?: string | null
          total_duration?: number
          total_credits_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_scenes: {
        Row: {
          id: string
          project_id: string
          scene_number: number
          prompt: string
          narration_text: string | null
          style: string | null
          model: string
          duration: number
          video_url: string | null
          status: string
          error_message: string | null
          credits_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scene_number: number
          prompt: string
          narration_text?: string | null
          style?: string | null
          model: string
          duration: number
          video_url?: string | null
          status?: string
          error_message?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scene_number?: number
          prompt?: string
          narration_text?: string | null
          style?: string | null
          model?: string
          duration?: number
          video_url?: string | null
          status?: string
          error_message?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
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
