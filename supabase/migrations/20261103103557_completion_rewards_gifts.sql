-- Future rewards only; no existing balances, question records or history changed.
create table public.avs_video_reward_progress (
  user_id text not null references public.avs_users(id), video_id text not null,
  duration numeric not null check(duration>0 and duration<=86400),
  coverage nummultirange not null default '{}', position numeric not null default 0,
  playing boolean not null default false, seen_at timestamptz not null default clock_timestamp(),
  primary key(user_id,video_id)
);
create or replace function public.avs_track_video_reward(p_user_id text,p_video_id text,p_duration numeric,p_position numeric,p_phase text) returns jsonb
language plpgsql set search_path='' as $$
declare r public.avs_video_reward_progress; elapsed numeric; watched numeric; earned integer:=0; pos numeric;
begin
  if p_duration is null or p_duration<=0 or p_duration>86400 or p_position is null or p_position<0 or p_position>86400 or p_phase not in ('start','progress','pause','seek','ended') then raise exception 'Invalid playback'; end if;
  perform public.avs_touch_engagement(p_user_id);
  if not exists(select 1 from public.avs_engagement_profiles where user_id=p_user_id) then raise exception 'Student required'; end if;
  insert into public.avs_video_reward_progress(user_id,video_id,duration) values(p_user_id,p_video_id,p_duration) on conflict do nothing;
  select * into r from public.avs_video_reward_progress where user_id=p_user_id and video_id=p_video_id for update;
  pos:=least(p_position,r.duration);
  elapsed:=least(30,greatest(0,extract(epoch from (clock_timestamp()-r.seen_at))));
  -- Seek/resume never credits a skipped segment. Union avoids replay double counting.
  if r.playing and p_phase in ('progress','pause','ended') and pos>r.position and pos-r.position<=elapsed*2.5 then
    r.coverage:=r.coverage+nummultirange(numrange(r.position,pos,'[)'));
  end if;
  update public.avs_video_reward_progress set coverage=r.coverage,position=pos,playing=p_phase in ('start','progress'),seen_at=clock_timestamp() where user_id=p_user_id and video_id=p_video_id;
  select coalesce(sum(upper(x)-lower(x)),0) into watched from unnest(r.coverage) x;
  if watched>=r.duration*0.99 and pos>=r.duration-1 then
    earned:=public.avs_award_points(p_user_id,jsonb_build_array(jsonb_build_object('key','video-complete:v2:'||p_video_id,'kind','Video fully watched','points',10)));
  end if;
  return jsonb_build_object('earned',earned,'saved',true,'watchedPercent',least(100,round(watched/r.duration*100,1)),'complete',exists(select 1 from public.avs_point_events where user_id=p_user_id and event_key='video-complete:v2:'||p_video_id));
end $$;

create table public.avs_gift_claims (
  id text primary key, user_id text not null references public.avs_users(id), milestone integer not null default 100000 check(milestone=100000),
  status text not null default 'requested' check(status in ('requested','approved','dispatched','delivered','rejected')),
  gift text not null default '' check(length(gift)<=200), delivery_note text not null default '' check(length(delivery_note)<=1000),
  admin_notes text not null default '' check(length(admin_notes)<=2000),
  version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,milestone)
);
create table public.avs_gift_history (
  id bigint generated always as identity primary key, claim_id text not null references public.avs_gift_claims(id),
  actor_id text not null references public.avs_users(id), status text not null, gift text not null, delivery_note text not null,
  admin_notes text not null, created_at timestamptz not null default now()
);
create index avs_gift_history_claim on public.avs_gift_history(claim_id,id);
create or replace function public.avs_student_gift(p_user_id text,p_request boolean default false) returns jsonb
language plpgsql set search_path='' as $$
declare score integer; c public.avs_gift_claims;
begin
  perform public.avs_touch_engagement(p_user_id);
  select p.points into score from public.avs_engagement_profiles p join public.avs_students s on s.user_id=p.user_id where p.user_id=p_user_id and (s.data->>'activeStatus')::boolean=true for update of p;
  if score is null then raise exception 'Student required'; end if;
  if p_request then
    if score<100000 then return jsonb_build_object('eligible',false,'points',score,'milestone',100000,'claim',null); end if;
    insert into public.avs_gift_claims(id,user_id) values(md5(p_user_id||':100000'),p_user_id) on conflict(user_id,milestone) do nothing returning * into c;
    if c.id is not null then insert into public.avs_gift_history(claim_id,actor_id,status,gift,delivery_note,admin_notes) values(c.id,p_user_id,'requested','','',''); end if;
  end if;
  return jsonb_build_object('eligible',score>=100000,'points',score,'milestone',100000,'claim',(select to_jsonb(g)-'user_id'-'admin_notes' from public.avs_gift_claims g where user_id=p_user_id),'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.status,'gift',h.gift,'delivery_note',h.delivery_note,'created_at',h.created_at) order by h.id) from public.avs_gift_history h join public.avs_gift_claims g on g.id=h.claim_id where g.user_id=p_user_id),'[]'::jsonb));
end $$;
create or replace function public.avs_admin_gifts(p_actor_id text) returns jsonb
language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin required'; end if;
  return jsonb_build_object('claims',coalesce((select jsonb_agg(to_jsonb(g)||jsonb_build_object('studentName',s.data->>'studentName','studentId',s.data->>'studentId','email',u.email,'points',p.points,'history',(select coalesce(jsonb_agg(to_jsonb(h) order by h.id),'[]'::jsonb) from public.avs_gift_history h where h.claim_id=g.id)) order by g.created_at desc) from public.avs_gift_claims g join public.avs_users u on u.id=g.user_id join public.avs_students s on s.user_id=g.user_id join public.avs_engagement_profiles p on p.user_id=g.user_id),'[]'::jsonb));
end $$;
create or replace function public.avs_update_gift(p_actor_id text,p_id text,p_version integer,p_status text,p_gift text,p_delivery_note text,p_admin_notes text) returns boolean
language plpgsql set search_path='' as $$
declare c public.avs_gift_claims;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin required'; end if;
  select * into c from public.avs_gift_claims where id=p_id for update;
  if c.id is null or c.version<>p_version then return false; end if;
  if c.status='delivered' or not (
    (c.status='requested' and p_status in ('requested','approved','rejected')) or
    (c.status='approved' and p_status in ('approved','dispatched','rejected')) or
    (c.status='dispatched' and p_status in ('dispatched','delivered')) or
    (c.status='rejected' and p_status in ('rejected','requested'))
  ) then raise exception 'Invalid transition'; end if;
  if p_status in ('approved','dispatched','delivered') and length(trim(p_gift))=0 then raise exception 'Choose a gift'; end if;
  if p_status in ('dispatched','delivered','rejected') and length(trim(p_delivery_note))=0 then raise exception 'Delivery note or rejection reason required'; end if;
  update public.avs_gift_claims set status=p_status,gift=trim(p_gift),delivery_note=trim(p_delivery_note),admin_notes=trim(p_admin_notes),version=version+1,updated_at=now() where id=p_id;
  insert into public.avs_gift_history(claim_id,actor_id,status,gift,delivery_note,admin_notes) values(p_id,p_actor_id,p_status,trim(p_gift),trim(p_delivery_note),trim(p_admin_notes));
  return true;
end $$;
alter table public.avs_video_reward_progress enable row level security;
alter table public.avs_gift_claims enable row level security;
alter table public.avs_gift_history enable row level security;
revoke all on public.avs_video_reward_progress,public.avs_gift_claims,public.avs_gift_history from anon,authenticated;
grant all on public.avs_video_reward_progress,public.avs_gift_claims,public.avs_gift_history to service_role;
grant usage,select on sequence public.avs_gift_history_id_seq to service_role;
revoke execute on function public.avs_track_video_reward(text,text,numeric,numeric,text),public.avs_student_gift(text,boolean),public.avs_admin_gifts(text),public.avs_update_gift(text,text,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.avs_track_video_reward(text,text,numeric,numeric,text),public.avs_student_gift(text,boolean),public.avs_admin_gifts(text),public.avs_update_gift(text,text,integer,text,text,text,text) to service_role;
