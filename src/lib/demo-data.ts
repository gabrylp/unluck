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
  // ☕ Food & Treats
  { id: 'r1', user_id: demoUserId, title: 'Buy a coffee', description: 'Treat yourself to a coffee or milk tea', point_cost: 10, icon: '☕', created_at: '', updated_at: '' },
  { id: 'r2', user_id: demoUserId, title: 'Grab a snack', description: 'Fast food or your favorite merienda', point_cost: 15, icon: '🍟', created_at: '', updated_at: '' },
  { id: 'r3', user_id: demoUserId, title: 'Café treat', description: 'Relax at a café with a drink and pastry', point_cost: 20, icon: '🧋', created_at: '', updated_at: '' },
  { id: 'r4', user_id: demoUserId, title: 'Dine out', description: 'Eat at a sit-down restaurant', point_cost: 30, icon: '🍽️', created_at: '', updated_at: '' },
  { id: 'r5', user_id: demoUserId, title: 'Treat a friend', description: 'Buy a full meal for yourself and a friend', point_cost: 40, icon: '🫶', created_at: '', updated_at: '' },

  // 💰 Money & Investing
  { id: 'r6', user_id: demoUserId, title: 'Top up savings', description: 'Add to your GCash, GoTyme, or Maya savings', point_cost: 20, icon: '💰', created_at: '', updated_at: '' },
  { id: 'r7', user_id: demoUserId, title: 'Invest', description: 'Buy stocks, crypto, or fund your broker', point_cost: 35, icon: '📈', created_at: '', updated_at: '' },
  { id: 'r8', user_id: demoUserId, title: 'Emergency fund', description: 'Add ₱500 to your emergency fund', point_cost: 40, icon: '🛡️', created_at: '', updated_at: '' },

  // 🛒 Tech & Digital
  { id: 'r9', user_id: demoUserId, title: 'Customize setup', description: 'Buy a skin, wallpaper, or aesthetic upgrade', point_cost: 10, icon: '🎨', created_at: '', updated_at: '' },
  { id: 'r10', user_id: demoUserId, title: 'Premium app', description: 'Unlock a subscription or premium feature', point_cost: 25, icon: '🔓', created_at: '', updated_at: '' },
  { id: 'r11', user_id: demoUserId, title: 'Digital asset', description: 'Buy a course, template, plugin, or license', point_cost: 35, icon: '💾', created_at: '', updated_at: '' },

  // 🛍️ Shopping
  { id: 'r12', user_id: demoUserId, title: 'Beauty or grooming', description: 'Buy a new product or self-care item', point_cost: 15, icon: '💄', created_at: '', updated_at: '' },
  { id: 'r13', user_id: demoUserId, title: 'New clothing', description: 'Buy a new piece of clothing or shoes', point_cost: 25, icon: '👕', created_at: '', updated_at: '' },
  { id: 'r14', user_id: demoUserId, title: 'Room decor', description: 'Upgrade your space with something new', point_cost: 30, icon: '🏠', created_at: '', updated_at: '' },
  { id: 'r15', user_id: demoUserId, title: 'New bag or accessory', description: 'Treat yourself to a new bag or accessory', point_cost: 40, icon: '👟', created_at: '', updated_at: '' },

  // 🧘 Rest & Fun
  { id: 'r16', user_id: demoUserId, title: 'Rest day', description: 'Guilt-free day off — no tasks, no code', point_cost: 5, icon: '😌', created_at: '', updated_at: '' },
  { id: 'r17', user_id: demoUserId, title: 'Movie night', description: 'Watch a movie or series guilt-free', point_cost: 15, icon: '🎬', created_at: '', updated_at: '' },
  { id: 'r18', user_id: demoUserId, title: 'Night out', description: 'Go out with friends', point_cost: 20, icon: '🎉', created_at: '', updated_at: '' },
  { id: 'r19', user_id: demoUserId, title: 'Self-care', description: 'Massage, haircut, or spa treatment', point_cost: 35, icon: '💆', created_at: '', updated_at: '' },

  // 📚 Learning
  { id: 'r20', user_id: demoUserId, title: 'Buy a book', description: 'Tech, trading, or self-improvement', point_cost: 30, icon: '📖', created_at: '', updated_at: '' },
  { id: 'r21', user_id: demoUserId, title: 'Take a course', description: 'Enroll in a workshop or online course', point_cost: 50, icon: '🎓', created_at: '', updated_at: '' },
]

export const demoLinks: ReferenceLink[] = [
  // 🎥 Videos
  { id: 'l1', user_id: demoUserId, title: 'AI Agents Full Course 2026', url: 'https://youtu.be/EsTrWCV0Ph4', description: 'Master Agentic AI in 2 hours', thumbnail_url: 'https://img.youtube.com/vi/EsTrWCV0Ph4/hqdefault.jpg', tags: ['ai', 'agents'], category: 'video', created_at: '' },
  { id: 'l2', user_id: demoUserId, title: 'CS50 Intro to Cybersecurity', url: 'https://youtu.be/9HOpanT0GRs', description: 'Harvard full university course', thumbnail_url: 'https://img.youtube.com/vi/9HOpanT0GRs/hqdefault.jpg', tags: ['cybersecurity', 'cs50'], category: 'video', created_at: '' },
  { id: 'l3', user_id: demoUserId, title: 'Start a Personal Brand', url: 'https://youtu.be/uJ8Pg6t_iho', description: 'Full course on building your brand', thumbnail_url: 'https://img.youtube.com/vi/uJ8Pg6t_iho/hqdefault.jpg', tags: ['business', 'branding'], category: 'video', created_at: '' },
  { id: 'l4', user_id: demoUserId, title: 'Build & Sell with Claude Code', url: 'https://youtu.be/mpALXah_PBg', description: '10+ hour course on AI-powered development', thumbnail_url: 'https://img.youtube.com/vi/mpALXah_PBg/hqdefault.jpg', tags: ['ai', 'coding', 'claude'], category: 'video', created_at: '' },

  // 📄 Text
  { id: 'l5', user_id: demoUserId, title: 'Trading for Beginners', url: 'https://www.investopedia.com/trading-4427765', description: 'Guide to getting started with trading', thumbnail_url: null, tags: ['trading', 'investing'], category: 'text', created_at: '' },
  { id: 'l6', user_id: demoUserId, title: 'Roblox Scripting Docs', url: 'https://create.roblox.com/docs/scripting', description: 'Official Roblox Lua scripting guide', thumbnail_url: null, tags: ['roblox', 'scripting'], category: 'text', created_at: '' },
  { id: 'l7', user_id: demoUserId, title: 'AI Agents Explained', url: 'https://www.deeplearning.ai/resources/', description: 'Resources on AI agents and agentic workflows', thumbnail_url: null, tags: ['ai', 'agents'], category: 'text', created_at: '' },
  { id: 'l8', user_id: demoUserId, title: 'How to Start a Business', url: 'https://www.shopify.com/blog/how-to-start-a-business', description: 'Step-by-step guide from Shopify', thumbnail_url: null, tags: ['business', 'entrepreneurship'], category: 'text', created_at: '' },
  { id: 'l9', user_id: demoUserId, title: 'Learning How to Learn', url: 'https://www.coursera.org/learn/learning-how-to-learn', description: 'Coursera course on metalearning techniques', thumbnail_url: null, tags: ['metalearning', 'learning'], category: 'text', created_at: '' },

  // 📚 Books
  { id: 'l10', user_id: demoUserId, title: 'Atomic Habits', url: 'https://jamesclear.com/atomic-habits', description: 'Build good habits and break bad ones', thumbnail_url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', tags: ['habits', 'productivity'], category: 'book', created_at: '' },
  { id: 'l11', user_id: demoUserId, title: 'Deep Work', url: 'https://www.calnewport.com/books/deep-work/', description: 'Rules for focused success in a distracted world', thumbnail_url: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg', tags: ['productivity', 'focus'], category: 'book', created_at: '' },
  { id: 'l12', user_id: demoUserId, title: 'The First 20 Hours', url: 'https://first20hours.com/', description: 'How to learn anything fast', thumbnail_url: 'https://covers.openlibrary.org/b/isbn/9781591846949-L.jpg', tags: ['metalearning', 'skills'], category: 'book', created_at: '' },
  { id: 'l13', user_id: demoUserId, title: 'The Intelligent Investor', url: 'https://www.amazon.com/Intelligent-Investor-Definitive-Investing-Essentials/dp/0060555661', description: 'The definitive book on value investing', thumbnail_url: 'https://covers.openlibrary.org/b/isbn/9780060555665-L.jpg', tags: ['investing', 'finance'], category: 'book', created_at: '' },
]

export const demoCompletions: Completion[] = []
