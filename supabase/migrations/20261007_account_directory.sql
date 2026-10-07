-- Run after 20261006_student_backend.sql. Keep credentials in server-only rows.
-- Generated columns make account/profile fields directly queryable in Supabase.
begin;
alter table public.avs_users
  add column if not exists must_change_password boolean generated always as (coalesce((data->>'mustChangePassword')::boolean,false)) stored,
  add column if not exists created_at text generated always as (data->>'createdAt') stored,
  add column if not exists updated_at text generated always as (data->>'updatedAt') stored;
alter table public.avs_students
  add column if not exists student_name text generated always as (data->>'studentName') stored,
  add column if not exists school_name text generated always as (data->>'schoolName') stored,
  add column if not exists student_email text generated always as (lower(trim(data->>'studentEmail'))) stored,
  add column if not exists student_phone text generated always as (
    case when regexp_replace(coalesce(data->>'studentPhone',''),'[^0-9]','','g') ~ '^91[0-9]{10}$'
      then substring(regexp_replace(data->>'studentPhone','[^0-9]','','g') from 3)
      else regexp_replace(coalesce(data->>'studentPhone',''),'[^0-9]','','g') end
  ) stored,
  add column if not exists medium text generated always as (data->>'medium') stored,
  add column if not exists academic_year text generated always as (data->>'academicYear') stored,
  add column if not exists standard text generated always as (coalesce(data->>'standard','12th Standard')) stored,
  add column if not exists active_status boolean generated always as ((data->>'activeStatus')::boolean) stored,
  add column if not exists must_change_password boolean generated always as ((data->>'mustChangePassword')::boolean) stored,
  add column if not exists created_at text generated always as (data->>'createdAt') stored,
  add column if not exists account_role text not null default 'student';
create unique index if not exists avs_users_id_role_idx on public.avs_users(id,role);
create unique index if not exists avs_students_phone_idx on public.avs_students(student_phone) where student_phone <> '';
create unique index if not exists avs_students_id_case_idx on public.avs_students(upper(student_id));
do $$ begin
  if not exists(select 1 from pg_constraint where conname='avs_student_role_fk' and conrelid='public.avs_students'::regclass) then
    alter table public.avs_students add constraint avs_student_role_fk foreign key(user_id,account_role) references public.avs_users(id,role);
    alter table public.avs_students add constraint avs_student_role_check check(account_role='student');
    alter table public.avs_students add constraint avs_student_profile_check check(
      data->>'id' is not null and data->>'id'=id and
      student_name is not null and length(trim(student_name)) between 2 and 100 and
      school_name is not null and length(trim(school_name)) between 2 and 200 and
      medium is not null and medium in ('English','Tamil') and
      active_status is not null and must_change_password is not null
    );
    alter table public.avs_users add constraint avs_user_credentials_check check(
      data->>'id' is not null and data->>'id'=id and
      data->>'passwordHash' is not null and length(data->>'passwordHash') >= 20 and
      email <> '' and created_at is not null and updated_at is not null
    );
  end if;
end $$;

-- This helper is available only to the trusted service backend. Public/browser
-- roles cannot register, grant roles or inspect account rows directly.
create or replace function public.avs_insert_student(p_profile jsonb,p_password_hash text,p_require_change boolean,p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare v_prefix text; next_number bigint; sid text; uid text; rid text; stamp text; u jsonb; s jsonb; phone text; email text; year text; requested text;
begin
  if coalesce(p_profile->>'stream','') not in ('Computer Science','Biology') then raise exception 'Invalid stream'; end if;
  if coalesce(length(trim(p_profile->>'studentName')),0) not between 2 and 100 or coalesce(length(trim(p_profile->>'schoolName')),0) not between 2 and 200 then raise exception 'Missing student fields'; end if;
  if p_password_hash is null or p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' then raise exception 'Invalid password hash'; end if;
  if coalesce(p_profile->>'medium','English') not in ('English','Tamil') then raise exception 'Invalid medium'; end if;
  year:=coalesce(nullif(trim(p_profile->>'academicYear'),''),'2026-2027');
  if year !~ '^[0-9]{4}-[0-9]{4}$' then raise exception 'Invalid academic year'; end if;
  phone:=regexp_replace(coalesce(p_profile->>'studentPhone',''),'[^0-9]','','g');
  if phone ~ '^91[0-9]{10}$' then phone:=substring(phone from 3); end if;
  if phone <> '' and phone !~ '^[6-9][0-9]{9}$' then raise exception 'Invalid mobile number'; end if;
  requested:=nullif(upper(trim(p_profile->>'studentId')),'');
  if requested is not null and requested !~ '^[A-Z0-9][A-Z0-9_-]{2,39}$' then raise exception 'Invalid account ID'; end if;
  if p_require_change then requested:=null; end if;
  v_prefix := case when p_profile->>'stream'='Computer Science' then 'AVSCS' else 'AVSBIO' end || substring(year from 3 for 2);
  if requested is not null then sid:=requested;
  else
    insert into public.avs_student_counters(prefix,value) values(v_prefix,0) on conflict do nothing;
    loop
      update public.avs_student_counters set value=value+1 where prefix=v_prefix returning value into next_number;
      sid:=v_prefix||'-'||lpad(next_number::text,greatest(4,length(next_number::text)),'0');
      exit when not exists(select 1 from public.avs_students where student_id=sid);
    end loop;
  end if;
  email:=coalesce(nullif(lower(trim(p_profile->>'studentEmail')),''),lower(sid)||'@avs.edu');
  if email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email)>254 then raise exception 'Invalid email'; end if;
  uid:='usr-'||gen_random_uuid()::text; rid:='stud-'||gen_random_uuid()::text;
  stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  u:=jsonb_build_object('id',uid,'role','student','email',email,'passwordHash',p_password_hash,'mustChangePassword',p_require_change,'createdAt',stamp,'updatedAt',stamp);
  s:=jsonb_build_object(
    'id',rid,'userId',uid,'studentId',sid,'studentName',trim(p_profile->>'studentName'),
    'registerNumber',coalesce(nullif(trim(p_profile->>'registerNumber'),''),sid),'schoolName',trim(p_profile->>'schoolName'),
    'standard',coalesce(nullif(trim(p_profile->>'standard'),''),'12th Standard'),
    'studentEmail',email,'studentPhone',phone,'stream',p_profile->>'stream',
    'medium',coalesce(p_profile->>'medium','English'),'academicYear',year,
    'activeStatus',true,'mustChangePassword',p_require_change,'createdAt',stamp
  );
  insert into public.avs_users(id,data) values(uid,u);
  insert into public.avs_students(id,data) values(rid,s);
  insert into public.avs_audit_logs(id,data) values(gen_random_uuid()::text,jsonb_build_object(
    'userId',coalesce(p_actor_id,uid),'action',case when p_require_change then 'CREATE_STUDENT' else 'REGISTER_STUDENT' end,
    'entityType','student','entityId',rid,'timestamp',stamp,'details',jsonb_build_object('studentId',sid)
  ));
  return jsonb_build_object('student',s,'user',u);
end $$;

create or replace function public.avs_create_student(p_profile jsonb,p_password_hash text,p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if coalesce(length(trim(p_profile->>'registerNumber')),0)<1 then raise exception 'Missing register number'; end if;
  return public.avs_insert_student(p_profile,p_password_hash,true,p_actor_id)->'student';
end $$;

create or replace function public.avs_register_student(p_profile jsonb,p_password_hash text) returns jsonb
language plpgsql set search_path = '' as $$
begin
  if coalesce(p_profile->>'studentPhone','')='' then raise exception 'Mobile number required'; end if;
  if coalesce(p_profile->>'standard','12th Standard') <> '12th Standard' then raise exception 'Only 12th Standard registration is available'; end if;
  -- Whitelisted fields in avs_insert_student force student role/active status.
  return public.avs_insert_student(p_profile,p_password_hash,false,null);
end $$;

-- Build the safe directory inside PostgreSQL: password hashes never leave this
-- query. The service-role key alone is insufficient without an admin actor.
create or replace function public.avs_admin_user_directory(p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  select coalesce(jsonb_agg(row_data order by row_created desc),'[]'::jsonb) into result from (
    select u.created_at as row_created,
      jsonb_build_object('id',u.id,'role',u.role,'email',u.email,'mustChangePassword',u.must_change_password,
        'createdAt',u.created_at,'updatedAt',u.updated_at) ||
      case when s.id is null then '{}'::jsonb else jsonb_build_object(
        'student',jsonb_strip_nulls(jsonb_build_object(
          'id',s.id,'userId',s.user_id,'studentId',s.student_id,'studentName',s.student_name,
          'registerNumber',s.data->>'registerNumber','schoolName',s.school_name,'standard',s.standard,
          'studentEmail',s.student_email,'studentPhone',s.student_phone,'stream',s.stream,'medium',s.medium,
          'academicYear',s.academic_year,'profilePhoto',s.data->>'profilePhoto','activeStatus',s.active_status,
          'mustChangePassword',s.must_change_password,'createdAt',s.created_at
        )),
        'learning',jsonb_strip_nulls(jsonb_build_object(
          'quizAttempts',coalesce(q.attempts,0),'mcqsAttempted',coalesce(q.attempted,0),
          'averageScore',case when coalesce(q.attempted,0)>0 then round(100.0*q.correct/q.attempted) else 0 end,
          'notesViewed',coalesce(a.notes,0),'videosWatched',coalesce(a.videos,0),
          'bookmarksCount',(select count(*) from public.avs_bookmarks b where b.owner_id=u.id),
          'lastActiveAt',greatest(s.created_at,q.last_active,(select max(l.data->>'timestamp') from public.avs_audit_logs l where l.data->>'userId'=u.id))
        ))
      ) end as row_data
    from public.avs_users u left join public.avs_students s on s.user_id=u.id
    left join lateral (
      select count(*) as attempts,sum((data->>'correctCount')::integer+(data->>'wrongCount')::integer) as attempted,
        sum((data->>'correctCount')::integer) as correct,max(data->>'completedAt') as last_active
      from public.avs_quiz_sessions where student_id=s.student_id and completed
    ) q on true
    left join lateral (
      select count(*) filter(where kind='note') as notes,
        count(*) filter(where kind='video' and coalesce((data->>'percent')::numeric,0)>=90) as videos
      from public.avs_activity where student_id=u.id
    ) a on true
  ) directory;
  return result;
end $$;

revoke all on function public.avs_insert_student(jsonb,text,boolean,text) from public,anon,authenticated;
revoke all on function public.avs_register_student(jsonb,text) from public,anon,authenticated;
revoke all on function public.avs_admin_user_directory(text) from public,anon,authenticated;
grant execute on function public.avs_insert_student(jsonb,text,boolean,text) to service_role;
grant execute on function public.avs_register_student(jsonb,text) to service_role;
grant execute on function public.avs_admin_user_directory(text) to service_role;
insert into public.avs_schema_versions(version) values('20261007_account_directory') on conflict do nothing;
notify pgrst, 'reload schema';
commit;
