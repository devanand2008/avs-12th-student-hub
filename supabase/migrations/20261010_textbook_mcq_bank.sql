begin;

create table if not exists public.textbook_mcq_imports (
  book_id text primary key references public.textbooks(id),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  check (data->>'bookId' = book_id)
);
create table if not exists public.textbook_mcq_candidates (
  id text primary key,
  book_id text not null references public.textbooks(id),
  data jsonb not null,
  chapter_id text generated always as (data->>'chapterId') stored,
  status text generated always as (data->>'status') stored,
  updated_at timestamptz not null default now(),
  check (data->>'id' = id and data->>'bookId' = book_id),
  check (status in ('Needs Review','Published')),
  check (jsonb_typeof(data->'options') = 'array' and jsonb_array_length(data->'options') between 2 and 4),
  check ((data->>'page')::integer > 0),
  check (status <> 'Published' or (data->>'correctAnswer' is not null and data->>'correctAnswer' in ('A','B','C','D')))
);
create index if not exists textbook_mcq_book_chapter_status on public.textbook_mcq_candidates(book_id,chapter_id,status);
alter table public.textbook_mcq_imports enable row level security;
alter table public.textbook_mcq_candidates enable row level security;
revoke all on public.textbook_mcq_imports, public.textbook_mcq_candidates from anon, authenticated;
grant all on public.textbook_mcq_imports, public.textbook_mcq_candidates to service_role;

create or replace function public.avs_textbook_mcq_catalog() returns jsonb
language sql stable set search_path = '' as $$
  with entries as (
    select c.book_id,c.chapter_id,c.id,q.status
    from public.textbook_mcq_candidates c
    left join public.avs_questions q on q.id=c.id
    union all
    select ch.data->>'bookId',q.chapter_id,q.id,q.status from public.avs_questions q
    join public.avs_curriculum ch on ch.kind='chapter' and ch.id=q.chapter_id
    where ch.data->>'bookId' is not null and not exists(select 1 from public.textbook_mcq_candidates c where c.id=q.id)
  ), counts as (
    select book_id,chapter_id,count(*)::integer as total,
      count(*) filter(where status='Published')::integer as published
    from entries group by book_id,chapter_id
  )
  select coalesce(jsonb_agg(i.data || jsonb_build_object(
    'total',coalesce((select sum(total) from counts where book_id=i.book_id),0),
    'published',coalesce((select sum(published) from counts where book_id=i.book_id),0),
    'review',coalesce((select sum(total-published) from counts where book_id=i.book_id),0),
    'chapters',(select coalesce(jsonb_agg(ch || jsonb_build_object(
      'published',coalesce(c.published,0),'review',coalesce(c.total-c.published,0)
    ) order by (ch->>'page')::integer),'[]'::jsonb)
    from jsonb_array_elements(i.data->'chapters') ch
    left join counts c on c.book_id=i.book_id and c.chapter_id=ch->>'id')
  ) order by i.book_id),'[]'::jsonb) from public.textbook_mcq_imports i;
$$;

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
    'status','Published','qualityFlags','[]'::jsonb,'reviewedBy',p_actor_id,'reviewedAt',stamp);
  question:=jsonb_build_object(
    'id',p_id,'chapterId',candidate->>'chapterId','subjectId',candidate->>'subjectId',
    'questionText',trim(p_question),'questionTextTamil',case when book.source_medium='Tamil' then trim(p_question) else '' end,
    'optionA',p_options->>0,'optionB',p_options->>1,'optionC',coalesce(p_options->>2,''),'optionD',coalesce(p_options->>3,''),
    'correctAnswer',p_answer,'explanation','Answer reviewed by an administrator against the source textbook.',
    'explanationTamil','','difficulty','Medium','sourceType','Book-In','status','Published','stream','Common','createdAt',stamp,
    'sourceTextbookId',book.id,'sourcePage',(candidate->>'page')::integer,'sourceQuestionNumber',(candidate->>'number')::integer,
    'language',book.source_medium,'answerVerification','Teacher Review'
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

create or replace function public.avs_import_questions(p_rows jsonb,p_actor_id text) returns jsonb
language plpgsql set search_path = '' as $$
declare item jsonb; imported integer := 0; changed integer; audit_id text := gen_random_uuid()::text;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 100 then raise exception 'Import at most 100 questions'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    if item->>'id' is null or item->>'questionText' is null or item->>'correctAnswer' is null or item->>'correctAnswer' not in ('A','B','C','D')
      or length(trim(item->>'questionText')) not between 8 and 2500 or coalesce(trim(item->>('option'||(item->>'correctAnswer'))),'')=''
      or item->>'status' is distinct from 'Published' or not exists(select 1 from public.avs_curriculum c where c.kind='chapter' and c.id=item->>'chapterId' and c.data->>'subjectId'=item->>'subjectId' and (c.data->>'isActive')::boolean)
    then raise exception 'Invalid reviewed question or chapter'; end if;
    insert into public.avs_questions(id,data) values(item->>'id',item) on conflict(id) do nothing;
    get diagnostics changed = row_count;imported:=imported+changed;
  end loop;
  insert into public.avs_audit_logs(id,data) values(audit_id,jsonb_build_object('id',audit_id,'userId',p_actor_id,'action','IMPORT_REVIEWED_MCQ','entity','question','entityId','bulk-import','createdAt',now()::text));
  return jsonb_build_object('imported',imported,'skipped',jsonb_array_length(p_rows)-imported);
end;
$$;
revoke all on function public.avs_import_questions(jsonb,text) from public,anon,authenticated;
grant execute on function public.avs_import_questions(jsonb,text) to service_role;
insert into public.avs_schema_versions(version) values('20261010_textbook_mcq_bank') on conflict do nothing;
notify pgrst,'reload schema';
commit;
