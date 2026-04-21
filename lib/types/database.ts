export type UserRole = "tutor" | "caregiver" | "vet";

export type User = {
  id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
};

export type Cat = {
  id: string;
  tutor_id: string;
  name: string;
  birthdate: string | null;
  weight_kg: number | null;
  photo_url: string | null;
  created_at: string;
};

export type MealSchedule = {
  id: string;
  cat_id: string;
  time_of_day: string;
  grams: number;
  created_at: string;
};

export type MealLog = {
  id: string;
  cat_id: string;
  logged_by: string;
  served_at: string;
  grams_served: number;
  grams_eaten: number;
  notes: string | null;
  created_at: string;
};

export type DailyProgress = {
  cat_id: string;
  day: string;
  goal_grams: number;
  eaten_grams: number;
  completed: boolean;
  updated_at: string;
};

export type DietProtocol = {
  id: string;
  cat_id: string;
  vet_id: string;
  daily_goal_grams: number;
  notes: string | null;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
};

export type FeedingTip = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};
