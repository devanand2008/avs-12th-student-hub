-- Local integration only. No existing session rows or snapshots are rewritten.
-- Row locking makes the first submitted non-timed answer win concurrent calls.
create or replace function public.avs_save_answer(p_session_id text,p_student_id text,p_question_id text,p_answer text,p_seconds numeric default 0,p_review boolean default false) returns jsonb
language plpgsql set search_path = '' as $$
declare s jsonb; snapshot jsonb; answer_record jsonb;
begin
  select data,question_snapshot into s,snapshot from public.avs_quiz_sessions where id=p_session_id and student_id=p_student_id for update;
  if s is null or (s->>'isCompleted')::boolean or not (s->'questionIds' ? p_question_id) then return null; end if;
  if s->>'expiresAt' is not null and clock_timestamp()>(s->>'expiresAt')::timestamptz then return null; end if;
  if p_answer is not null and p_answer not in ('A','B','C','D') then return null; end if;
  if p_seconds<0 or p_seconds>86400 then return null; end if;
  if s->>'mode' is distinct from 'timed' and s->'answers'->p_question_id->>'selectedAnswer' is not null then return s; end if;
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
    if s->>'mode' is distinct from 'timed' and s->'answers'->item.key->>'selectedAnswer' is not null then continue; end if;
    s:=jsonb_set(s,array['answers',item.key],jsonb_build_object('questionId',item.key,'selectedAnswer',answer,'isCorrect',coalesce(snapshot->item.key->>'correctAnswer'=answer,false),'timeSpentSeconds',coalesce(s->'answers'->item.key->'timeSpentSeconds','0'::jsonb),'markedForReview',coalesce(s->'answers'->item.key->'markedForReview','false'::jsonb)),true);
  end loop;
  update public.avs_quiz_sessions set data=s where id=p_session_id;
  return s;
end $$;

revoke all on function public.avs_save_answer(text,text,text,text,numeric,boolean) from public, anon, authenticated;
revoke all on function public.avs_save_answers(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.avs_save_answer(text,text,text,text,numeric,boolean) to service_role;
grant execute on function public.avs_save_answers(text,text,jsonb) to service_role;
