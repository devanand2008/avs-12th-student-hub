-- Run after 20261007_account_directory.sql. SMS verification is performed by
-- Supabase Auth; this transaction binds its verified phone to the AVS student.
begin;
alter table public.avs_students
  add column if not exists phone_verified_at text generated always as (data->>'phoneVerifiedAt') stored,
  add column if not exists phone_verified_number text generated always as (data->>'phoneVerifiedNumber') stored;

create or replace function public.avs_verify_student_phone(p_user_id text,p_phone text,p_auth_id text,p_invalidated_hash text) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; stamp text;
begin
  if p_phone is null or p_phone !~ '^[6-9][0-9]{9}$' or coalesce(length(p_auth_id),0)<1 then return null; end if;
  if p_invalidated_hash is null or p_invalidated_hash !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' then return null; end if;
  perform id from public.avs_users where id=p_user_id and role='student' for update;
  select data into s from public.avs_students where user_id=p_user_id and student_phone=p_phone and active_status=true for update;
  if s is null or (s->>'phoneVerifiedAt' is not null and s->>'phoneVerifiedNumber'=p_phone and (s->>'initialPasswordSetAt' is not null or not (s->>'mustChangePassword')::boolean)) then return null; end if;
  stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  -- Set a personal password after proof of ownership. A password selected by
  -- someone who registered this phone earlier must never remain authoritative.
  s:=(s-'initialPasswordSetAt')||jsonb_build_object('phoneVerifiedAt',stamp,'phoneVerifiedNumber',p_phone,'phoneAuthId',p_auth_id,'mustChangePassword',true);
  update public.avs_students set data=s where user_id=p_user_id;
  update public.avs_users set data=data||jsonb_build_object('passwordHash',p_invalidated_hash,'mustChangePassword',true,'updatedAt',stamp) where id=p_user_id;
  insert into public.avs_audit_logs(id,data) values(gen_random_uuid()::text,jsonb_build_object('userId',p_user_id,'action','VERIFY_FIRST_LOGIN_PHONE','entityType','student','entityId',s->>'id','timestamp',stamp));
  return s;
end $$;
revoke all on function public.avs_verify_student_phone(text,text,text,text) from public,anon,authenticated;
grant execute on function public.avs_verify_student_phone(text,text,text,text) to service_role;

-- Record completion with the password change so only unfinished first logins
-- can retry SMS. Later administrator resets never become OTP reset shortcuts.
create or replace function public.avs_change_password(p_user_id text,p_expected_hash text,p_new_hash text,p_require_change boolean default false) returns boolean
language plpgsql set search_path = '' as $$
declare u jsonb;
begin
  select data into u from public.avs_users where id=p_user_id for update;
  if u is null or u->>'passwordHash' <> p_expected_hash then return false; end if;
  if p_new_hash is null or p_new_hash !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' then raise exception 'Invalid password hash'; end if;
  update public.avs_users set data=data||jsonb_build_object('passwordHash',p_new_hash,'mustChangePassword',p_require_change,'updatedAt',clock_timestamp()) where id=p_user_id;
  update public.avs_students set data=data||jsonb_build_object('mustChangePassword',p_require_change)||case when not p_require_change and data->>'phoneVerifiedAt' is not null then jsonb_build_object('initialPasswordSetAt',coalesce(data->>'initialPasswordSetAt',clock_timestamp()::text)) else '{}'::jsonb end where user_id=p_user_id;
  return true;
end $$;
revoke all on function public.avs_change_password(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.avs_change_password(text,text,text,boolean) to service_role;
insert into public.avs_schema_versions(version) values('20261007_first_login_otp') on conflict do nothing;
notify pgrst,'reload schema';
commit;
