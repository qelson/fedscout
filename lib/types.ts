export interface Opportunity {
  id: string
  sam_notice_id: string
  title: string
  agency: string
  naics_code: string
  posted_date: string
  response_deadline: string | null
  estimated_value_min: number | null
  estimated_value_max: number | null
  description: string
  sam_url: string
  created_at: string
}

export interface UserOpportunity {
  id: string
  user_id: string
  opportunity_id: string
  status: OppStatus
  created_at: string
  updated_at: string
}

export type OppStatus = 'new' | 'interested' | 'pursuing' | 'pass'

export interface OpportunityWithStatus extends Opportunity {
  status: OppStatus | null
  user_opportunity_id: string | null
}

export interface UserPreferences {
  id: string
  user_id: string
  naics_codes: string[]
  keywords: string[]
  agencies: string[]
  min_value: number | null
  max_value: number | null
}
