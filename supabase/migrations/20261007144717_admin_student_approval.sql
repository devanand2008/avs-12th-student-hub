-- Administrator approval is distinct from proof of phone ownership.
-- Existing verified students retain access; pending students are not approved.
begin;

create or replace function public.avs_approve_student(p_id text,p_actor_id text,p_password_hash text) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; u jsonb; uid text; stamp text;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if p_password_hash is null or p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' then raise exception 'Invalid password hash'; end if;
  select user_id into uid from public.avs_students where id=p_id or student_id=upper(p_id);
  if uid is null then return null; end if;
  select data into u from public.avs_users where id=uid and role='student' for update;
  if u is null then return null; end if;
  select data into s from public.avs_students where user_id=uid for update;
  if s is null or not coalesce((s->>'activeStatus')::boolean,false) or s->>'adminApprovedAt' is not null then return null; end if;
  stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  s:=(s-'initialPasswordSetAt')||jsonb_build_object('adminApprovedAt',stamp,'adminApprovedBy',p_actor_id,'mustChangePassword',true);
  update public.avs_students set data=s where user_id=uid;
  -- Invalidate the password supplied during registration, and all prior sessions.
  update public.avs_users set data=data||jsonb_build_object('passwordHash',p_password_hash,'mustChangePassword',true,'updatedAt',stamp) where id=uid;
  insert into public.avs_audit_logs(id,data) values(gen_random_uuid()::text,jsonb_build_object('userId',p_actor_id,'action','APPROVE_STUDENT','entityType','student','entityId',s->>'id','timestamp',stamp,'details',jsonb_build_object('studentId',s->>'studentId','activationMethod','admin')));
  return s;
end $$;
revoke all on function public.avs_approve_student(text,text,text) from public,anon,authenticated;
grant execute on function public.avs_approve_student(text,text,text) to service_role;

-- Only the administrator creation entry point may request immediate approval.
-- Public registration always uses the existing whitelist and remains pending.
create or replace function public.avs_create_student(p_profile jsonb,p_password_hash text,p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if coalesce(length(trim(p_profile->>'registerNumber')),0)<1 then raise exception 'Missing register number'; end if;
  s:=public.avs_insert_student(p_profile,p_password_hash,true,p_actor_id)->'student';
  if p_profile->>'approveOnCreate'='true' then
    s:=public.avs_approve_student(s->>'id',p_actor_id,p_password_hash);
  end if;
  return s;
end $$;
revoke all on function public.avs_create_student(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.avs_create_student(jsonb,text,text) to service_role;

create or replace function public.avs_change_password(p_user_id text,p_expected_hash text,p_new_hash text,p_require_change boolean default false) returns boolean
language plpgsql set search_path = '' as $$
declare u jsonb;
begin
  select data into u from public.avs_users where id=p_user_id for update;
  if u is null or u->>'passwordHash' <> p_expected_hash then return false; end if;
  if p_new_hash is null or p_new_hash !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' then raise exception 'Invalid password hash'; end if;
  update public.avs_users set data=data||jsonb_build_object('passwordHash',p_new_hash,'mustChangePassword',p_require_change,'updatedAt',clock_timestamp()) where id=p_user_id;
  update public.avs_students set data=data||jsonb_build_object('mustChangePassword',p_require_change)||case when not p_require_change and (data->>'phoneVerifiedAt' is not null or data->>'adminApprovedAt' is not null) then jsonb_build_object('initialPasswordSetAt',coalesce(data->>'initialPasswordSetAt',clock_timestamp()::text)) else '{}'::jsonb end where user_id=p_user_id;
  return true;
end $$;
revoke all on function public.avs_change_password(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.avs_change_password(text,text,text,boolean) to service_role;

-- The safe admin directory definition is appended below.

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
          'mustChangePassword',s.must_change_password,'createdAt',s.created_at,
          'adminApprovedAt',s.data->>'adminApprovedAt','adminApprovedBy',s.data->>'adminApprovedBy',
          'phoneVerifiedAt',s.data->>'phoneVerifiedAt','phoneVerifiedNumber',s.data->>'phoneVerifiedNumber'
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

revoke all on function public.avs_admin_user_directory(text) from public,anon,authenticated;
grant execute on function public.avs_admin_user_directory(text) to service_role;
insert into public.avs_schema_versions(version) values('20261007144717_admin_student_approval') on conflict do nothing;
notify pgrst,'reload schema';
commit;
