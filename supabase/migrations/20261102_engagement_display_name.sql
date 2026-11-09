-- Use an ASCII-only SQL source for the separator across Windows shell encodings.
create or replace function public.avs_touch_engagement(p_user_id text) returns void
language plpgsql set search_path='' as $$
begin
  insert into public.avs_engagement_profiles(user_id,display_name)
  select u.id, left(coalesce(nullif(split_part(trim(s.data->>'studentName'),' ',1),''),'Student'),24)||' '||chr(183)||' '||upper(left(md5(u.id),4))
  from public.avs_users u join public.avs_students s on s.user_id=u.id
  where u.id=p_user_id and u.role='student' and (s.data->>'activeStatus')::boolean=true
  on conflict(user_id) do update set last_seen=now();
end $$;
-- Only repair names that exactly match the initial generated default. Preserve
-- every chosen alias, score, preference and timestamp.
update public.avs_engagement_profiles p set display_name=
  left(coalesce(nullif(split_part(trim(s.data->>'studentName'),' ',1),''),'Student'),24)||' '||chr(183)||' '||upper(left(md5(p.user_id),4))
from public.avs_students s where s.user_id=p.user_id and p.display_name=
  left(coalesce(nullif(split_part(trim(s.data->>'studentName'),' ',1),''),'Student'),24)||' '||chr(194)||chr(183)||' '||upper(left(md5(p.user_id),4));
