export type TimeSection = 'morning' | 'afternoon' | 'night'
export type CompletionType = 'daily' | 'custom' | 'manual'
export type StreakMode = 'easy' | 'hard'

export interface Target {
  id: string
  user_id: string
  title: string
  time_section: TimeSection | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  target_id: string
  parent_id: string | null
  title: string
  description: string
  completion_type: CompletionType
  custom_schedule: number[] | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Completion {
  id: string
  user_id: string
  task_id: string
  completed_date: string
  points_awarded: number
  created_at: string
}

export interface TargetBonus {
  id: string
  user_id: string
  target_id: string
  awarded_at: string
}

export interface UserPoints {
  user_id: string
  total_earned: number
  total_spent: number
  current_balance: number
}

export interface RewardTemplate {
  id: string
  user_id: string
  title: string
  description: string
  point_cost: number
  icon: string | null
  created_at: string
  updated_at: string
}

export interface RewardRedemption {
  id: string
  user_id: string
  reward_template_id: string
  points_spent: number
  redeemed_at: string
}

export interface Streak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
  streak_mode: StreakMode
}

export interface ReferenceLink {
  id: string
  user_id: string
  title: string
  url: string
  description: string | null
  thumbnail_url: string | null
  tags: string[]
  category: 'video' | 'text' | 'book' | 'other'
  created_at: string
}

export interface TaskWithChildren extends Task {
  children: TaskWithChildren[]
  completed?: boolean
}

export interface TargetWithProgress extends Target {
  tasks: TaskWithChildren[]
  completion_pct: number
  completed_count: number
  total_count: number
  is_completed: boolean
}
