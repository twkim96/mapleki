export interface Content {
  id: string; // UUID
  name: string;
  is_server_content: boolean;
  created_at: string;
}

export interface Record {
  id: string; // UUID
  content_id: string;
  title: string;
  created_at: string;
  updated_at?: string | null;
}

export interface SheetData {
  id: string; // UUID
  record_id: string;
  power_rank: number | null;
  character_name: string;
  content_rank: number | null;
  grade: string | null;
  created_at: string;
}

export interface GuildMember {
  character_name: string;
  power_rank: number | null;
  updated_at: string;
}
