begin;

create or replace function public.avs_review_textbook_mcq(
  p_id text,p_actor_id text,p_question text,p_options jsonb,p_answer text
) returns jsonb
language plpgsql set search_path = '' as $$
declare candidate jsonb; question jsonb; chapter jsonb; book record; stamp text := now()::text; options_count integer; audit_id text := gen_random_uuid()::text;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  select data into candidate from public.textbook_mcq_candidates where id=p_id for update;
  if candidate is null then raise exception 'Textbook question not found'; end if;
  options_count:=jsonb_array_length(p_options);
  if p_question is null or p_options is null or p_answer is null or length(trim(p_question)) not between 8 and 2500 or jsonb_typeof(p_options)<>'array' or options_count not between 2 and 4
    or p_answer not in ('A','B','C','D') or strpos('ABCD',p_answer)>options_count
    or exists(select 1 from jsonb_array_elements_text(p_options) o where length(trim(o)) not between 1 and 1000)
    or (select count(distinct lower(trim(o))) from jsonb_array_elements_text(p_options) o)<>options_count
    or strpos(p_question,chr(65533))>0 or strpos(p_options::text,chr(65533))>0
  then raise exception 'Correct the question and options, and choose an answer before publishing'; end if;
  select data into chapter from public.avs_curriculum where kind='chapter' and id=candidate->>'chapterId';
  select * into book from public.textbooks where id=candidate->>'bookId';
  if chapter is null or book.id is null then raise exception 'Textbook chapter is unavailable'; end if;
  candidate:=candidate || jsonb_build_object('questionText',trim(p_question),'options',p_options,'correctAnswer',p_answer,
    'status','Published','presentation','Text','qualityFlags','[]'::jsonb,'reviewedBy',p_actor_id,'reviewedAt',stamp);
  question:=jsonb_build_object(
    'id',p_id,'chapterId',candidate->>'chapterId','subjectId',candidate->>'subjectId',
    'questionText',trim(p_question),'questionTextTamil',case when book.source_medium='Tamil' then trim(p_question) else '' end,
    'optionA',p_options->>0,'optionB',p_options->>1,'optionC',coalesce(p_options->>2,''),'optionD',coalesce(p_options->>3,''),
    'correctAnswer',p_answer,'explanation','Answer reviewed by an administrator against the source textbook.',
    'explanationTamil','','difficulty','Medium','sourceType','Book-In','status','Published','stream','Common','createdAt',stamp,
    'sourceTextbookId',book.id,'sourcePage',(candidate->>'page')::integer,'sourceQuestionNumber',(candidate->>'number')::integer,
    'language',book.source_medium,'answerVerification','Teacher Review','sourcePresentation','Text'
  );
  insert into public.avs_questions(id,data) values(p_id,question) on conflict(id) do update set data=excluded.data;
  update public.textbook_mcq_candidates set data=candidate,updated_at=now() where id=p_id;
  insert into public.avs_audit_logs(id,data) values(audit_id,jsonb_build_object(
    'id',audit_id,'userId',p_actor_id,'action','REVIEW_TEXTBOOK_MCQ','entity','question','entityId',p_id,'createdAt',stamp
  ));
  return candidate;
end;
$$;
revoke all on function public.avs_textbook_mcq_catalog() from public,anon,authenticated;
revoke all on function public.avs_review_textbook_mcq(text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.avs_textbook_mcq_catalog() to service_role;
grant execute on function public.avs_review_textbook_mcq(text,text,text,jsonb,text) to service_role;

commit;
