-- Distinguish wet vs dry food on meal logs.
-- Daily goal is expressed in dry-food grams (kcal-equivalent).
-- When the tutor logs wet food, the app converts the input to dry equivalent
-- before insert (factor ~0.28). food_type is stored so vet/history can tell.

create type public.food_type as enum ('dry', 'wet');

alter table public.meal_logs
  add column food_type public.food_type not null default 'dry';
