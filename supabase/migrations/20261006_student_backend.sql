-- Run after 20261006_learning_resources.sql. Custom Student ID authentication
-- stays on the Next.js server; these tables are never exposed to browser roles.
create table if not exists public.avs_schema_versions (version text primary key);
create table if not exists public.avs_users (
  id text primary key, data jsonb not null,
  email text generated always as (lower(trim(data->>'email'))) stored unique not null,
  role text generated always as (data->>'role') stored not null check (role in ('admin','student')),
  check (data->>'id' = id), check (length(data->>'passwordHash') > 20)
);
create table if not exists public.avs_students (
  id text primary key, data jsonb not null,
  user_id text generated always as (data->>'userId') stored unique not null references public.avs_users(id),
  student_id text generated always as (data->>'studentId') stored unique not null,
  register_number text generated always as (lower(trim(data->>'registerNumber'))) stored unique not null,
  stream text generated always as (data->>'stream') stored not null check (stream in ('Computer Science','Biology')),
  check (data->>'id' = id), check (length(register_number) > 0)
);
create table if not exists public.avs_student_counters (prefix text primary key, value bigint not null default 0);
create table if not exists public.avs_curriculum (
  kind text not null check (kind in ('subject','book','chapter','topic','test','knowledge')),
  id text not null, data jsonb not null, primary key (kind,id), check (data->>'id' = id)
);
create table if not exists public.avs_questions (
  id text primary key, data jsonb not null,
  chapter_id text generated always as (data->>'chapterId') stored not null,
  subject_id text generated always as (data->>'subjectId') stored not null,
  status text generated always as (data->>'status') stored not null check (status in ('Draft','Teacher Review','Approved','Published')),
  check (data->>'id' = id), check (data->>'correctAnswer' in ('A','B','C','D'))
);
create index if not exists avs_questions_subject_idx on public.avs_questions(subject_id,chapter_id,status);
create table if not exists public.avs_quiz_sessions (
  id text primary key, data jsonb not null, question_snapshot jsonb not null,
  student_id text generated always as (data->>'studentId') stored not null references public.avs_students(student_id),
  completed boolean generated always as ((data->>'isCompleted')::boolean) stored not null,
  check (data->>'id' = id)
);
create index if not exists avs_quiz_student_idx on public.avs_quiz_sessions(student_id,completed);
create table if not exists public.avs_progress (
  student_id text not null references public.avs_students(student_id), chapter_id text not null,
  data jsonb not null, primary key(student_id,chapter_id)
);
create table if not exists public.avs_activity (
  student_id text not null references public.avs_users(id), kind text not null check(kind in ('note','video')),
  resource_id text not null references public.learning_resources(id) on delete cascade,
  data jsonb not null, primary key(student_id,kind,resource_id)
);
-- Activity is keyed by user ID so administrators can preview resources too.
create table if not exists public.avs_bookmarks (
  owner_id text not null references public.avs_users(id), content_type text not null check(content_type in ('note','video','question','chapter')),
  content_id text not null, data jsonb not null, primary key(owner_id,content_type,content_id)
);
create table if not exists public.avs_announcements (id text primary key, data jsonb not null);
create table if not exists public.avs_audit_logs (
  id text primary key, data jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.avs_revoked_sessions (id text primary key, expires_at timestamptz not null);
create table if not exists public.avs_rate_limits (key text primary key, count integer not null, reset_at timestamptz not null);

create or replace function public.avs_bootstrap_admin(p_user jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare existing jsonb;
begin
  if p_user->>'role' <> 'admin' then raise exception 'Invalid administrator'; end if;
  insert into public.avs_users(id,data) values(p_user->>'id',p_user) on conflict(email) do nothing;
  select data into existing from public.avs_users where email=lower(trim(p_user->>'email'));
  if existing->>'role' <> 'admin' then raise exception 'Email is already assigned to a student'; end if;
  return existing;
end $$;

create or replace function public.avs_create_student(p_profile jsonb,p_password_hash text,p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_prefix text; next_number bigint; sid text; uid text; rid text; stamp text; u jsonb; s jsonb;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if p_profile->>'stream' not in ('Computer Science','Biology') then raise exception 'Invalid stream'; end if;
  if length(trim(p_profile->>'studentName'))<2 or length(trim(p_profile->>'registerNumber'))<1 or length(trim(p_profile->>'schoolName'))<2 then raise exception 'Missing student fields'; end if;
  if length(p_password_hash)<20 then raise exception 'Invalid password hash'; end if;
  v_prefix := case when p_profile->>'stream'='Computer Science' then 'AVSCS' else 'AVSBIO' end || substring(coalesce(p_profile->>'academicYear','2026-2027') from 3 for 2);
  insert into public.avs_student_counters(prefix,value) values(v_prefix,0) on conflict do nothing;
  update public.avs_student_counters set value=value+1 where avs_student_counters.prefix=v_prefix returning value into next_number;
  sid:=v_prefix||'-'||lpad(next_number::text,greatest(4,length(next_number::text)), '0');
  uid:='usr-'||gen_random_uuid()::text; rid:='stud-'||gen_random_uuid()::text; stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  u:=jsonb_build_object('id',uid,'role','student','email',coalesce(nullif(lower(trim(p_profile->>'studentEmail')),''),lower(sid)||'@students.avs.invalid'),'passwordHash',p_password_hash,'mustChangePassword',true,'createdAt',stamp,'updatedAt',stamp);
  s:=p_profile - 'temporaryPassword' || jsonb_build_object('id',rid,'userId',uid,'studentId',sid,'studentEmail',u->>'email','studentPhone',coalesce(p_profile->>'studentPhone',''),'medium',coalesce(p_profile->>'medium','English'),'academicYear',coalesce(p_profile->>'academicYear','2026-2027'),'activeStatus',true,'mustChangePassword',true,'createdAt',stamp);
  insert into public.avs_users(id,data) values(uid,u);
  insert into public.avs_students(id,data) values(rid,s);
  insert into public.avs_audit_logs(id,data) values(gen_random_uuid()::text,jsonb_build_object('userId',p_actor_id,'action','CREATE_STUDENT','entityType','student','entityId',rid,'timestamp',stamp,'details',jsonb_build_object('studentId',sid)));
  return s;
end $$;

create or replace function public.avs_change_password(p_user_id text,p_expected_hash text,p_new_hash text,p_require_change boolean default false) returns boolean
language plpgsql set search_path = '' as $$
declare u jsonb;
begin
  select data into u from public.avs_users where id=p_user_id for update;
  if u is null or u->>'passwordHash' <> p_expected_hash then return false; end if;
  if length(p_new_hash)<20 then raise exception 'Invalid password hash'; end if;
  update public.avs_users set data=data||jsonb_build_object('passwordHash',p_new_hash,'mustChangePassword',p_require_change,'updatedAt',clock_timestamp()) where id=p_user_id;
  update public.avs_students set data=data||jsonb_build_object('mustChangePassword',p_require_change) where user_id=p_user_id;
  return true;
end $$;

create or replace function public.avs_toggle_student(p_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb;
begin
  update public.avs_students set data=data||jsonb_build_object('activeStatus',not (data->>'activeStatus')::boolean) where id=p_id or student_id=p_id returning data into s;
  return s;
end $$;

create or replace function public.avs_start_quiz(p_session jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare snapshot jsonb; question_count integer;
begin
  if not exists(select 1 from public.avs_students where student_id=p_session->>'studentId' and (data->>'activeStatus')::boolean) then raise exception 'Active student required'; end if;
  select jsonb_object_agg(id,data),count(*) into snapshot,question_count from public.avs_questions
    where id in(select jsonb_array_elements_text(p_session->'questionIds')) and status='Published' and subject_id=p_session->>'subjectId';
  if question_count=0 or question_count<>jsonb_array_length(p_session->'questionIds') then raise exception 'Invalid question assignment'; end if;
  p_session:=p_session||jsonb_build_object('startedAt',clock_timestamp(),'answers','{}'::jsonb,'score',0,'totalQuestions',question_count,'isCompleted',false);
  if p_session->>'mode'='timed' then p_session:=p_session||jsonb_build_object('expiresAt',clock_timestamp()+interval '15 minutes'); end if;
  insert into public.avs_quiz_sessions(id,data,question_snapshot) values(p_session->>'id',p_session,snapshot);
  return p_session;
end $$;

create or replace function public.avs_save_answer(p_session_id text,p_student_id text,p_question_id text,p_answer text,p_seconds numeric default 0,p_review boolean default false) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; snapshot jsonb; answer_record jsonb;
begin
  select data,question_snapshot into s,snapshot from public.avs_quiz_sessions where id=p_session_id and student_id=p_student_id for update;
  if s is null or (s->>'isCompleted')::boolean or not (s->'questionIds' ? p_question_id) then return null; end if;
  if s->>'expiresAt' is not null and clock_timestamp()>(s->>'expiresAt')::timestamptz then return null; end if;
  if p_answer is not null and p_answer not in ('A','B','C','D') then return null; end if;
  if p_seconds<0 or p_seconds>86400 then return null; end if;
  answer_record:=jsonb_build_object('questionId',p_question_id,'selectedAnswer',p_answer,'isCorrect',coalesce(snapshot->p_question_id->>'correctAnswer'=p_answer,false),'timeSpentSeconds',p_seconds,'markedForReview',p_review);
  s:=jsonb_set(s,array['answers',p_question_id],answer_record,true);
  update public.avs_quiz_sessions set data=s where id=p_session_id;
  return s;
end $$;

create or replace function public.avs_save_answers(p_session_id text,p_student_id text,p_answers jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; snapshot jsonb; item record; answer text;
begin
  select data,question_snapshot into s,snapshot from public.avs_quiz_sessions where id=p_session_id and student_id=p_student_id for update;
  if s is null or (s->>'isCompleted')::boolean or jsonb_typeof(p_answers)<>'object' then return null; end if;
  if s->>'expiresAt' is not null and clock_timestamp()>(s->>'expiresAt')::timestamptz then return null; end if;
  for item in select * from jsonb_each(p_answers) loop
    answer:=item.value #>> '{}';
    if not (s->'questionIds' ? item.key) or (answer is not null and answer not in ('A','B','C','D')) then return null; end if;
    s:=jsonb_set(s,array['answers',item.key],jsonb_build_object('questionId',item.key,'selectedAnswer',answer,'isCorrect',coalesce(snapshot->item.key->>'correctAnswer'=answer,false),'timeSpentSeconds',coalesce(s->'answers'->item.key->'timeSpentSeconds','0'::jsonb),'markedForReview',coalesce(s->'answers'->item.key->'markedForReview','false'::jsonb)),true);
  end loop;
  update public.avs_quiz_sessions set data=s where id=p_session_id;
  return s;
end $$;

create or replace function public.avs_submit_quiz(p_session_id text,p_student_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; correct_count integer; wrong_count integer; total_count integer; seconds integer; chapter text; pct numeric; stamp timestamptz:=clock_timestamp();
begin
  select data into s from public.avs_quiz_sessions where id=p_session_id and student_id=p_student_id for update;
  if s is null then return null; end if;
  if (s->>'isCompleted')::boolean then return s; end if;
  select count(*) filter(where (value->>'isCorrect')::boolean),count(*) filter(where value->>'selectedAnswer' is not null and not (value->>'isCorrect')::boolean) into correct_count,wrong_count from jsonb_each(s->'answers');
  total_count:=(s->>'totalQuestions')::integer;
  seconds:=greatest(0,floor(extract(epoch from (least(stamp,coalesce((s->>'expiresAt')::timestamptz,stamp))-(s->>'startedAt')::timestamptz))))::integer;
  s:=s||jsonb_build_object('score',correct_count,'correctCount',correct_count,'wrongCount',wrong_count,'unansweredCount',total_count-correct_count-wrong_count,'timeTakenSeconds',seconds,'isCompleted',true,'completedAt',stamp);
  update public.avs_quiz_sessions set data=s where id=p_session_id;
  chapter:=s->>'chapterId'; pct:=100.0*correct_count/greatest(1,total_count);
  if chapter is not null then
    insert into public.avs_progress(student_id,chapter_id,data) values(p_student_id,chapter,jsonb_build_object('id',p_student_id||'_'||chapter,'studentId',p_student_id,'chapterId',chapter,'notesViewed',0,'noteLastPage',1,'videoWatchPercentage',0,'mcqsAttempted',total_count,'bestScore',pct,'averageScore',pct,'lastAccessedAt',stamp,'isCompleted',false))
    on conflict(student_id,chapter_id) do update set data=avs_progress.data||jsonb_build_object('mcqsAttempted',coalesce((avs_progress.data->>'mcqsAttempted')::integer,0)+total_count,'bestScore',greatest(coalesce((avs_progress.data->>'bestScore')::numeric,0),pct),'lastAccessedAt',stamp);
  end if;
  return s;
end $$;

create or replace function public.avs_toggle_bookmark(p_owner_id text,p_bookmark jsonb) returns boolean
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id||':'||(p_bookmark->>'contentType')||':'||(p_bookmark->>'contentId'),0));
  delete from public.avs_bookmarks where owner_id=p_owner_id and content_type=p_bookmark->>'contentType' and content_id=p_bookmark->>'contentId';
  if found then return false; end if;
  insert into public.avs_bookmarks(owner_id,content_type,content_id,data) values(p_owner_id,p_bookmark->>'contentType',p_bookmark->>'contentId',p_bookmark);
  return true;
end $$;

create or replace function public.avs_check_rate_limit(p_key text,p_max integer,p_window_seconds integer) returns jsonb
language plpgsql set search_path = '' as $$
declare hits integer; stamp timestamptz:=clock_timestamp();
begin
  insert into public.avs_rate_limits(key,count,reset_at) values(p_key,1,stamp+make_interval(secs=>p_window_seconds))
  on conflict(key) do update set count=case when avs_rate_limits.reset_at<=stamp then 1 else least(avs_rate_limits.count+1,p_max+1) end,
    reset_at=case when avs_rate_limits.reset_at<=stamp then stamp+make_interval(secs=>p_window_seconds) else avs_rate_limits.reset_at end returning count into hits;
  return jsonb_build_object('success',hits<=p_max,'remaining',greatest(0,p_max-hits));
end $$;

-- No public EXECUTE grants: only the trusted backend can invoke these RPCs.
do $$ declare name text; signature regprocedure; begin
  foreach name in array array['avs_schema_versions','avs_users','avs_students','avs_student_counters','avs_curriculum','avs_questions','avs_quiz_sessions','avs_progress','avs_activity','avs_bookmarks','avs_announcements','avs_audit_logs','avs_revoked_sessions','avs_rate_limits'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('revoke all on table public.%I from anon,authenticated',name);
    execute format('grant all on table public.%I to service_role',name);
  end loop;
  for signature in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'avs_%' loop
    execute format('revoke all on function %s from public,anon,authenticated',signature);
    execute format('grant execute on function %s to service_role',signature);
  end loop;
end $$;
insert into public.avs_schema_versions(version) values('20261006_student_backend') on conflict do nothing;
notify pgrst, 'reload schema';
