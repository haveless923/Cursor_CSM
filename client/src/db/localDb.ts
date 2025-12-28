import Dexie, { Table } from 'dexie';

export interface Customer {
  id?: number;
  customer_name?: string;
  company_name?: string;
  city?: string | string[];
  customer_source?: string;
  customer_source_other?: string;
  custom_tags?: string | string[];
  due_date?: string;
  contact_person?: string;
  position?: string | string[];
  name?: string;
  financial_capacity?: string;
  customer_rating?: number;
  status?: string;
  category?: string;
  follow_up_action?: string;
  requirement_list?: string | Array<{ description: string; ticket_url: string; status: string }>;
  next_step?: string;
  got_online_projects?: string | Array<{ project_name: string; url: string; tag: string }>;
  pipeline_status?: string;
  service_expiry_date?: string;
  has_mini_game?: boolean;
  mini_game_name?: string;
  mini_game_platforms?: string | string[];
  mini_game_url?: string;
  gpm_status?: string;
  projects?: string | Array<{ project: string; links: string[] }>;
  owner_id?: number;
  project_link?: string;
  notes?: string;
  last_test_date?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
  isLocal?: boolean; // 标记是否为本地创建但未同步
}

export interface NextStepHistory {
  id?: number;
  customer_id: number;
  next_step: string;
  created_by?: number;
  username?: string;
  created_at?: string;
}

class LocalDatabase extends Dexie {
  customers!: Table<Customer, number>;

  constructor() {
    super('CSMDatabase');
    this.version(1).stores({
      customers: '++id, customer_name, status, updated_at, synced_at'
    });
  }
}

export const localDb = new LocalDatabase();


