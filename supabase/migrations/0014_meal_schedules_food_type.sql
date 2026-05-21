-- Pre-registered meal: store food_type so the log form can default the radio
-- and the grams field carries the type the tutor cadastrou.
-- Reuses the food_type enum from migration 0012.

alter table public.meal_schedules
  add column food_type public.food_type not null default 'dry';
