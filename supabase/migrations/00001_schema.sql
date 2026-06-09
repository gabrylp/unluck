-- Targets
CREATE TABLE targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_section TEXT CHECK (time_section IN ('morning', 'afternoon', 'night')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_targets_user ON targets(user_id);
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own targets" ON targets FOR ALL USING (user_id = auth.uid());

-- Tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completion_type TEXT NOT NULL DEFAULT 'manual' CHECK (completion_type IN ('daily', 'custom', 'manual')),
  custom_schedule INTEGER[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_target ON tasks(target_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own tasks" ON tasks FOR ALL USING (user_id = auth.uid());

-- Completions
CREATE TABLE completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_completions_user ON completions(user_id);
CREATE INDEX idx_completions_task ON completions(task_id);
CREATE INDEX idx_completions_date ON completions(completed_date);
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own completions" ON completions FOR ALL USING (user_id = auth.uid());

-- Target Bonuses (track +5 bonus awards)
CREATE TABLE target_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_target_bonuses_user ON target_bonuses(user_id);
ALTER TABLE target_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own bonuses" ON target_bonuses FOR ALL USING (user_id = auth.uid());

-- User Points (denormalized balance)
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0
);
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own points" ON user_points FOR ALL USING (user_id = auth.uid());

-- Reward Templates
CREATE TABLE reward_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  point_cost INTEGER NOT NULL CHECK (point_cost > 0),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reward_templates_user ON reward_templates(user_id);
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own reward templates" ON reward_templates FOR ALL USING (user_id = auth.uid());

-- Reward Redemptions
CREATE TABLE reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_template_id UUID NOT NULL REFERENCES reward_templates(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own redemptions" ON reward_redemptions FOR ALL USING (user_id = auth.uid());

-- Streaks
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_mode TEXT NOT NULL DEFAULT 'easy' CHECK (streak_mode IN ('easy', 'hard'))
);
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own streaks" ON streaks FOR ALL USING (user_id = auth.uid());

-- Reference Links
CREATE TABLE reference_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reference_links_user ON reference_links(user_id);
ALTER TABLE reference_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own reference links" ON reference_links FOR ALL USING (user_id = auth.uid());

-- Create trigger for new user setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_points (user_id, total_earned, total_spent, current_balance) VALUES (NEW.id, 0, 0, 0);
  INSERT INTO streaks (user_id, current_streak, longest_streak, streak_mode) VALUES (NEW.id, 0, 0, 'easy');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
