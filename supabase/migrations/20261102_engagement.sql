-- Additive engagement storage. Existing questions, sessions and history are untouched.
create table if not exists public.avs_engagement_profiles (
  user_id text primary key references public.avs_users(id),
  display_name text not null check(length(display_name) between 1 and 40),
  points integer not null default 0 check(points >= 0),
  last_seen timestamptz not null default now(),
  leaderboard_visible boolean not null default true,
  reminders_enabled boolean not null default true,
  reminder_after timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.avs_point_events (
  user_id text not null references public.avs_users(id),
  event_key text not null check(length(event_key) between 1 and 300),
  kind text not null, points integer not null check(points between 1 and 10),
  created_at timestamptz not null default now(), primary key(user_id,event_key)
);
create table if not exists public.avs_reminder_deliveries (
  id text primary key, user_id text not null references public.avs_users(id),
  status text not null default 'pending' check(status in ('pending','sent','failed','cancelled')),
  created_at timestamptz not null default now(), provider_id text
);
create index if not exists avs_engagement_rank on public.avs_engagement_profiles(points desc);
create or replace function public.avs_touch_engagement(p_user_id text) returns void
language plpgsql set search_path='' as $$
begin
  insert into public.avs_engagement_profiles(user_id,display_name)
  select u.id, left(coalesce(nullif(split_part(trim(s.data->>'studentName'),' ',1),''),'Student'),24)||' · '||upper(left(md5(u.id),4))
  from public.avs_users u join public.avs_students s on s.user_id=u.id
  where u.id=p_user_id and u.role='student' and (s.data->>'activeStatus')::boolean=true
  on conflict(user_id) do update set last_seen=now();
end $$;
create or replace function public.avs_award_points(p_user_id text,p_events jsonb) returns integer
language plpgsql set search_path='' as $$
declare earned integer;
begin
  if jsonb_array_length(p_events)>1001 then raise exception 'Too many events'; end if;
  perform public.avs_touch_engagement(p_user_id);
  if not exists(select 1 from public.avs_engagement_profiles p join public.avs_students s on s.user_id=p.user_id where p.user_id=p_user_id and (s.data->>'activeStatus')::boolean=true) then return 0; end if;
  with added as (
    insert into public.avs_point_events(user_id,event_key,kind,points)
    select p_user_id,e->>'key',e->>'kind',(e->>'points')::integer from jsonb_array_elements(p_events) e
    on conflict(user_id,event_key) do nothing returning points
  ) select coalesce(sum(points),0)::integer into earned from added;
  update public.avs_engagement_profiles set points=points+earned,updated_at=now() where user_id=p_user_id;
  return earned;
end $$;
create or replace function public.avs_engagement_board(p_user_id text) returns jsonb
language sql set search_path='' as $$
  select jsonb_build_object(
    'me',(select to_jsonb(p)||jsonb_build_object('rank',case when p.leaderboard_visible then 1+(select count(*) from public.avs_engagement_profiles q join public.avs_students s on s.user_id=q.user_id where q.leaderboard_visible and q.points>p.points and (s.data->>'activeStatus')::boolean=true) else null end) from public.avs_engagement_profiles p where p.user_id=p_user_id),
    'leaders',coalesce((select jsonb_agg(x) from (
      select p.display_name as name,p.points,rank() over(order by p.points desc) as rank,p.user_id=p_user_id as "isMe"
      from public.avs_engagement_profiles p join public.avs_students s on s.user_id=p.user_id
      where p.leaderboard_visible and (s.data->>'activeStatus')::boolean=true
      order by p.points desc,p.display_name,p.user_id limit 50
    )x),'[]'::jsonb),
    'recent',coalesce((select jsonb_agg(x) from (select kind,points,created_at from public.avs_point_events where user_id=p_user_id order by created_at desc,event_key limit 10)x),'[]'::jsonb)
  );
$$;
create or replace function public.avs_engagement_preferences(p_user_id text,p_name text,p_visible boolean,p_reminders boolean) returns void
language plpgsql set search_path='' as $$
begin
  update public.avs_engagement_profiles set display_name=p_name,leaderboard_visible=p_visible,reminders_enabled=p_reminders where user_id=p_user_id;
end $$;
create or replace function public.avs_unsubscribe_reminders(p_user_id text) returns void
language sql set search_path='' as $$ update public.avs_engagement_profiles set reminders_enabled=false where user_id=p_user_id; $$;
create or replace function public.avs_claim_reminders(p_limit integer default 20) returns jsonb
language plpgsql set search_path='' as $$
declare r record; jobs jsonb='[]'::jsonb; job text;
begin
  for r in select p.user_id,u.email,s.data->>'studentName' as name from public.avs_engagement_profiles p
    join public.avs_users u on u.id=p.user_id join public.avs_students s on s.user_id=u.id
    where p.reminders_enabled and p.last_seen<=now()-interval '3 days' and p.reminder_after<=now()
    and (s.data->>'activeStatus')::boolean=true and u.role='student'
    and u.email not like '%@avs.edu' and u.email not like '%@example.%' and u.email not like '%.test'
    order by p.reminder_after,p.user_id limit least(greatest(p_limit,1),20) for update of p skip locked
  loop
    job:=md5(r.user_id||clock_timestamp()::text);
    insert into public.avs_reminder_deliveries(id,user_id) values(job,r.user_id);
    update public.avs_engagement_profiles set reminder_after=now()+interval '7 days' where user_id=r.user_id;
    jobs:=jobs||jsonb_build_array(jsonb_build_object('id',job,'userId',r.user_id,'email',r.email,'name',r.name));
  end loop;
  return jobs;
end $$;
create or replace function public.avs_finish_reminder(p_id text,p_status text,p_provider_id text default null) returns void
language plpgsql set search_path='' as $$
declare uid text;
begin
  update public.avs_reminder_deliveries set status=p_status,provider_id=p_provider_id where id=p_id and status='pending' returning user_id into uid;
  -- Keep the weekly reservation even for uncertain provider outcomes; never retry
  -- an ambiguously delivered message with a new idempotency key the next day.
end $$;
alter table public.avs_engagement_profiles enable row level security;
alter table public.avs_point_events enable row level security;
alter table public.avs_reminder_deliveries enable row level security;
revoke all on public.avs_engagement_profiles,public.avs_point_events,public.avs_reminder_deliveries from anon,authenticated;
grant all on public.avs_engagement_profiles,public.avs_point_events,public.avs_reminder_deliveries to service_role;
revoke all on function public.avs_touch_engagement(text),public.avs_award_points(text,jsonb),public.avs_engagement_board(text),public.avs_engagement_preferences(text,text,boolean,boolean),public.avs_unsubscribe_reminders(text),public.avs_claim_reminders(integer),public.avs_finish_reminder(text,text,text) from public,anon,authenticated;
grant execute on function public.avs_touch_engagement(text),public.avs_award_points(text,jsonb),public.avs_engagement_board(text),public.avs_engagement_preferences(text,text,boolean,boolean),public.avs_unsubscribe_reminders(text),public.avs_claim_reminders(integer),public.avs_finish_reminder(text,text,text) to service_role;
