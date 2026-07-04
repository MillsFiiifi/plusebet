-- Web Push: one row per subscribed device (a user can have several).
create table if not exists push_subscriptions (
  endpoint    text primary key,
  user_id     text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx
  on push_subscriptions (user_id);

-- Tracks the last score we've already sent a goal alert for, per match, so we
-- notify once per goal (and know which side scored).
create table if not exists goal_notifications (
  match_id    text primary key,
  home        integer not null default 0,
  away        integer not null default 0,
  updated_at  timestamptz not null default now()
);
