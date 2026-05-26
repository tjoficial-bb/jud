
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'Admin' | 'Operador';
  status: 'Ativo' | 'Inativo';
}

export interface Property {
  id: string;
  title: string;
  type: string;
  modality: string;
  address: string;
  city: string;
  state: string;
  area: number;
  valuation_value: number;
  min_bid: number;
  planned_max_bid: number;
  auctioned_value: number;
  expected_sale_value: number;
  actual_sale_value: number;
  status: string;
  observations: string;
  created_at: string;
  auction_url?: string;
}

export interface Process {
  id: string;
  cnj_number: string;
  court: string;
  chamber: string;
  action_type: string;
  debt_value: number;
  parties: string;
  status: string;
  observations: string;
  property_id: string;
  source: string;
}

export interface AIConfig {
  primary_ia: string;
  secondary_ia: string;
  gemini_key: string;
  openai_key: string;
  claude_key: string;
  deepseek_key: string;
  datajud_key?: string;
  custom_domain?: string;
  updated_at?: string;
}

export interface StrategicBrainItem {
  id: string;
  title: string;
  type: 'url' | 'file' | 'text';
  content?: string;
  data?: string;
  status: 'synced' | 'pending' | 'error';
  timestamp: string;
  category?: string;
  source?: string;
  extracted_text?: string;
  url?: string;
  username?: string;
  password?: string;
  is_automated?: boolean;
  last_sync?: string;
  created_at?: string;
}

