import { Target, Task, Completion, UserPoints, Streak, RewardTemplate, ReferenceLink } from './types'

export const demoUserId = 'demo-user-id'

export const demoTargets: Target[] = [
  { id: 't1', user_id: demoUserId, title: 'Mind', time_section: 'morning', sort_order: 0, created_at: '', updated_at: '' },
  { id: 't2', user_id: demoUserId, title: 'Body', time_section: 'morning', sort_order: 1, created_at: '', updated_at: '' },
  { id: 't3', user_id: demoUserId, title: 'School', time_section: 'afternoon', sort_order: 2, created_at: '', updated_at: '' },
]

export const demoTasks: Task[] = [
  { id: 'tk1', user_id: demoUserId, target_id: 't1', parent_id: null, title: 'Meditate', description: '10 min mindfulness', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'tk2', user_id: demoUserId, target_id: 't1', parent_id: 'tk1', title: 'Journal', description: 'Write your thoughts', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'tk3', user_id: demoUserId, target_id: 't1', parent_id: 'tk1', title: 'Breathing', description: '5 deep breaths', completion_type: 'daily', custom_schedule: null, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'tk4', user_id: demoUserId, target_id: 't2', parent_id: null, title: 'Exercise', description: '30 min workout', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'tk5', user_id: demoUserId, target_id: 't2', parent_id: 'tk4', title: 'Stretch', description: '', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'tk6', user_id: demoUserId, target_id: 't3', parent_id: null, title: 'Study', description: 'Review class material', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
]

export const demoPoints: UserPoints = {
  user_id: demoUserId,
  total_earned: 0,
  total_spent: 0,
  current_balance: 0,
}

export const demoStreak: Streak = {
  user_id: demoUserId,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: '',
  streak_mode: 'easy',
}

export const demoRewards: RewardTemplate[] = [
  { id: 'r1', user_id: demoUserId, title: 'Buy a coffee', description: 'Treat yourself', point_cost: 10, icon: '☕', created_at: '', updated_at: '' },
  { id: 'r2', user_id: demoUserId, title: 'Netflix night', description: 'Guilt-free movie', point_cost: 25, icon: '🎬', created_at: '', updated_at: '' },
  { id: 'r3', user_id: demoUserId, title: 'New book', description: 'Buy any book', point_cost: 50, icon: '📖', created_at: '', updated_at: '' },
]

export const demoLinks: ReferenceLink[] = [
  { id: 'l1', user_id: demoUserId, title: 'Atomic Habits', url: 'https://jamesclear.com/atomic-habits', description: 'Summary of key concepts', thumbnail_url: null, tags: ['habits', 'productivity'], created_at: '' },
  { id: 'l2', user_id: demoUserId, title: 'Meditation Guide', url: 'https://www.headspace.com/meditation-101', description: 'Getting started with meditation', thumbnail_url: null, tags: ['mindfulness'], created_at: '' },
]

export const demoCompletions: Completion[] = []
