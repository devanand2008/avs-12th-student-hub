begin;

-- Hold the known, unverified legacy examples; completed quiz snapshots are untouched.
with previous as (
  select id,data from public.avs_questions
  where id in ('q-bot-101','q-cs-101','q-cs-102','q-cs-103','q-cs-104','q-cs-105',
    'q-cs-701','q-cs-702','q-cs-703','q-zoo-201','q-zoo-202','q-zoo-203')
    and status='Published' and data->>'sourceTextbookId' is null
    and data->>'reviewedBy' is null and data->>'answerVerification' is null
  for update
), held as (
  update public.avs_questions q set data=q.data || jsonb_build_object(
    'status','Teacher Review','questionOrigin','Legacy Sample','reviewStatus','needs_teacher_review')
  from previous p where q.id=p.id returning q.id,p.data as before_data,q.data as after_data
)
insert into public.avs_audit_logs(id,data)
select gen_random_uuid()::text,jsonb_build_object('userId','system','action','HOLD_UNVERIFIED_LEGACY',
  'entity','question','entityId',id,'before',before_data,
  'after',after_data,'createdAt',now()::text) from held;

alter table public.textbook_mcq_candidates add column if not exists review_state text
  generated always as (coalesce(data->>'reviewStatus',case when data->>'status'='Published' then 'approved' else 'needs_teacher_review' end)) stored;
alter table public.textbook_mcq_candidates add column if not exists review_batch_id text
  generated always as (data->'reviewPreparation'->>'batchId') stored;
create index if not exists textbook_mcq_review_batches on public.textbook_mcq_candidates(book_id,review_batch_id,review_state);

-- Evidence preparation cannot publish, change a proposed answer, or overwrite human work.
create or replace function public.avs_prepare_textbook_review(p_rows jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare row jsonb; candidate jsonb; changed integer:=0; skipped integer:=0;
begin
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>20 then raise exception 'Prepare at most 20 candidates per transaction'; end if;
  for row in select value from jsonb_array_elements(p_rows) loop
    select data into candidate from public.textbook_mcq_candidates where id=row->>'id' for update;
    if candidate is null or candidate->>'status'<>'Needs Review' or candidate->>'reviewedBy' is not null
      or coalesce(candidate->>'reviewStatus','') in ('approved','rejected') then skipped:=skipped+1; continue; end if;
    if candidate->>'sourceSha256' is distinct from row->'reviewPreparation'->>'sourceSha256'
      or (candidate - 'reviewPreparation' - 'reviewStatus' - 'originalExtraction') is distinct from ((row->'originalExtraction') - 'reviewPreparation' - 'reviewStatus' - 'originalExtraction')
    then raise exception 'Source changed; prepare again'; end if;
    if candidate->'reviewPreparation' = row->'reviewPreparation' then skipped:=skipped+1; continue; end if;
    update public.textbook_mcq_candidates set data=candidate || jsonb_build_object(
      'reviewStatus','needs_teacher_review','reviewPreparation',row->'reviewPreparation',
      'originalExtraction',coalesce(candidate->'originalExtraction',candidate - 'reviewPreparation' - 'reviewStatus')),updated_at=clock_timestamp() where id=row->>'id';
    changed:=changed+1;
  end loop;
  return jsonb_build_object('prepared',changed,'skipped',skipped);
end $$;

-- Preserve the existing deployed endpoint while giving its explicit admin
-- publication action the same review state, original evidence and audit trail.
create or replace function public.avs_review_textbook_mcq(
  p_id text,p_actor_id text,p_question text,p_options jsonb,p_answer text
) returns jsonb language plpgsql set search_path='' as $$
declare candidate jsonb; before_data jsonb; question jsonb; chapter jsonb; published_chapter jsonb; book record;
  stamp text:=clock_timestamp()::text; options_count integer; audit_id text:=gen_random_uuid()::text; event jsonb;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  select data into candidate from public.textbook_mcq_candidates where id=p_id for update;
  if candidate is null then raise exception 'Textbook question not found'; end if;
  before_data:=candidate;
  options_count:=jsonb_array_length(p_options);
  if p_question is null or p_options is null or p_answer is null or length(trim(p_question)) not between 8 and 2500 or jsonb_typeof(p_options)<>'array' or options_count not between 2 and 4
    or p_answer not in ('A','B','C','D') or strpos('ABCD',p_answer)>options_count
    or exists(select 1 from jsonb_array_elements_text(p_options) o where length(trim(o)) not between 1 and 1000)
    or (select count(distinct lower(trim(o))) from jsonb_array_elements_text(p_options) o)<>options_count
    or strpos(p_question,chr(65533))>0 or strpos(p_options::text,chr(65533))>0
  then raise exception 'Correct the question and options, and choose an answer before publishing'; end if;
  select ch.data into published_chapter from public.avs_questions q
    join public.avs_curriculum ch on ch.kind='chapter' and ch.id=q.chapter_id
    where q.id=p_id and q.status='Published' and q.data->>'sourceTextbookId'=candidate->>'bookId'
      and q.chapter_id<>candidate->>'chapterId';
  if published_chapter is not null then candidate:=candidate || jsonb_build_object('chapterId',published_chapter->>'id','chapterTitle',published_chapter->>'title'); end if;
  select data into chapter from public.avs_curriculum where kind='chapter' and id=candidate->>'chapterId';
  select * into book from public.textbooks where id=candidate->>'bookId';
  if chapter is null or book.id is null then raise exception 'Textbook chapter is unavailable'; end if;
  candidate:=candidate || jsonb_build_object('questionText',trim(p_question),'options',p_options,'correctAnswer',p_answer,
    'status','Published','reviewStatus','approved','presentation','Text','qualityFlags','[]'::jsonb,
    'reviewedBy',p_actor_id,'reviewedAt',stamp,
    'originalExtraction',coalesce(before_data->'originalExtraction',before_data - 'reviewHistory' - 'reviewPreparation'));
  event:=jsonb_build_object('action','approve','actorId',p_actor_id,'at',stamp,'reason','Explicit administrator publication through the existing review endpoint',
    'before',jsonb_build_object('questionText',before_data->'questionText','options',before_data->'options','correctAnswer',before_data->'correctAnswer','status',before_data->'status'),
    'after',jsonb_build_object('questionText',candidate->'questionText','options',candidate->'options','correctAnswer',candidate->'correctAnswer','status',candidate->'status'));
  candidate:=candidate || jsonb_build_object('reviewHistory',coalesce(before_data->'reviewHistory','[]'::jsonb) || jsonb_build_array(event));
  question:=jsonb_build_object('id',p_id,'chapterId',candidate->>'chapterId','subjectId',candidate->>'subjectId',
    'questionText',trim(p_question),'questionTextTamil',case when book.source_medium='Tamil' then trim(p_question) else '' end,
    'optionA',p_options->>0,'optionB',p_options->>1,'optionC',coalesce(p_options->>2,''),'optionD',coalesce(p_options->>3,''),
    'correctAnswer',p_answer,'explanation','Answer reviewed by an administrator against the source textbook.',
    'explanationTamil','','difficulty','Medium','sourceType','Book-In','status','Published','stream','Common','createdAt',stamp,
    'sourceTextbookId',book.id,'sourcePage',(candidate->>'page')::integer,'sourceQuestionNumber',(candidate->>'number')::integer,
    'sourceAnswerPage',candidate->'keyPage','language',book.source_medium,'answerVerification','Teacher Review','sourcePresentation','Text',
    'reviewStatus','approved','reviewedBy',p_actor_id,'reviewedAt',stamp);
  insert into public.avs_questions(id,data) values(p_id,question) on conflict(id) do update set data=excluded.data;
  update public.textbook_mcq_candidates set data=candidate,updated_at=clock_timestamp() where id=p_id;
  insert into public.avs_audit_logs(id,data) values(audit_id,jsonb_build_object('id',audit_id,'userId',p_actor_id,
    'action','REVIEW_TEXTBOOK_MCQ','entity','question','entityId',p_id,'createdAt',stamp,'before',before_data,'after',candidate,'review',event));
  return candidate;
end $$;
revoke all on function public.avs_review_textbook_mcq(text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.avs_review_textbook_mcq(text,text,text,jsonb,text) to service_role;

create or replace function public.avs_moderate_textbook_mcq(
  p_id text,p_actor_id text,p_action text,p_question text,p_options jsonb,p_answer text,
  p_human_confirmed boolean,p_reason text,p_expected_updated_at timestamptz
) returns jsonb language plpgsql set search_path='' as $$
declare before_data jsonb; after_data jsonb; published_chapter jsonb; version timestamptz; stamp text:=clock_timestamp()::text; event jsonb; audit_id text:=gen_random_uuid()::text;
begin
  if not exists(select 1 from public.avs_users where id=p_actor_id and role='admin') then raise exception 'Admin authorization required'; end if;
  if p_action not in ('approve','edit','reject') or p_action is null then raise exception 'Choose a review action'; end if;
  select data,updated_at into before_data,version from public.textbook_mcq_candidates where id=p_id for update;
  if before_data is null then raise exception 'Textbook question not found'; end if;
  if p_expected_updated_at is null or version<>p_expected_updated_at then raise exception 'Review changed; reload the question'; end if;
  if p_action='approve' then
    if p_human_confirmed is distinct from true then raise exception 'Explicit human approval required'; end if;
    after_data:=public.avs_review_textbook_mcq(p_id,p_actor_id,p_question,p_options,p_answer);
    after_data:=after_data || jsonb_build_object('reviewStatus','approved');
    update public.avs_questions set data=data || jsonb_build_object('reviewStatus','approved','reviewedBy',p_actor_id,'reviewedAt',stamp,
      'sourceAnswerPage',before_data->'keyPage') where id=p_id;
  else
    if p_action='reject' and coalesce(length(trim(p_reason)),0)<3 then raise exception 'Give a rejection reason'; end if;
    if p_action='edit' and (coalesce(length(trim(p_question)),0) not between 8 and 2500 or jsonb_typeof(p_options)<>'array'
      or jsonb_array_length(p_options) not between 2 and 4 or exists(select 1 from jsonb_array_elements_text(p_options) o where length(o)>1000)
      or (p_answer is not null and (p_answer not in ('A','B','C','D') or strpos('ABCD',p_answer)>jsonb_array_length(p_options))))
    then raise exception 'Invalid review draft'; end if;
    after_data:=before_data || jsonb_build_object('status','Needs Review','reviewStatus',case when p_action='reject' then 'rejected' else 'needs_teacher_review' end);
    select ch.data into published_chapter from public.avs_questions q
      join public.avs_curriculum ch on ch.kind='chapter' and ch.id=q.chapter_id
      where q.id=p_id and q.status='Published' and q.data->>'sourceTextbookId'=before_data->>'bookId'
        and q.chapter_id<>before_data->>'chapterId';
    if published_chapter is not null then after_data:=after_data || jsonb_build_object('chapterId',published_chapter->>'id','chapterTitle',published_chapter->>'title'); end if;
    if p_action='edit' then after_data:=after_data || jsonb_build_object('questionText',trim(p_question),'options',p_options,'correctAnswer',p_answer); end if;
    -- Editing a published question withdraws it until it is explicitly re-approved.
    update public.avs_questions set data=data || jsonb_build_object('status','Teacher Review','reviewStatus',after_data->>'reviewStatus') where id=p_id;
  end if;
  event:=jsonb_build_object('action',p_action,'actorId',p_actor_id,'at',stamp,'reason',coalesce(p_reason,''),
    'before',jsonb_build_object('questionText',before_data->'questionText','options',before_data->'options','correctAnswer',before_data->'correctAnswer','status',before_data->'status'),
    'after',jsonb_build_object('questionText',after_data->'questionText','options',after_data->'options','correctAnswer',after_data->'correctAnswer','status',after_data->'status'));
  after_data:=after_data || jsonb_build_object('originalExtraction',coalesce(before_data->'originalExtraction',before_data - 'reviewHistory' - 'reviewPreparation'),
    'reviewedBy',p_actor_id,'reviewedAt',stamp,'reviewHistory',coalesce(before_data->'reviewHistory','[]'::jsonb) || jsonb_build_array(event));
  update public.textbook_mcq_candidates set data=after_data,updated_at=clock_timestamp() where id=p_id;
  insert into public.avs_audit_logs(id,data) values(audit_id,jsonb_build_object('id',audit_id,'userId',p_actor_id,
    'action','MODERATE_TEXTBOOK_MCQ','entity','question','entityId',p_id,'createdAt',stamp,'before',before_data,'after',after_data,'review',event));
  return after_data;
end $$;

create or replace function public.avs_textbook_review_batches(p_book_id text) returns jsonb
language sql stable set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(batch) order by batch."batchId"),'[]'::jsonb) from (
    select review_batch_id as "batchId",chapter_id as "chapterId",count(*)::integer as total,
      count(*) filter(where data->'reviewPreparation'->>'sourceCheck'='matched')::integer as "sourceMatched",
      count(*) filter(where data->'reviewPreparation'->>'keyCheck'='matched')::integer as "keyMatched",
      count(*) filter(where data->'reviewPreparation'->>'keyCheck'<>'matched')::integer as uncertain,
      count(*) filter(where jsonb_array_length(coalesce(data->'reviewPreparation'->'duplicateIds','[]'::jsonb))>0)::integer as duplicates,
      count(*) filter(where review_state='needs_teacher_review')::integer as pending,
      count(*) filter(where review_state='approved')::integer as approved,
      count(*) filter(where review_state='rejected')::integer as rejected
    from public.textbook_mcq_candidates where book_id=p_book_id and review_batch_id is not null group by review_batch_id,chapter_id
  ) batch;
$$;
-- Admin publication filters count actual student-facing rows, including the
-- retained Electronics questions whose parser classification is still review.
create or replace function public.avs_textbook_review_page(
  p_book_id text,p_chapter_id text,p_filter text,p_batch_id text,p_page integer
) returns jsonb language sql stable set search_path='' as $$
  with selected as (
    select c.id,c.data || jsonb_build_object('updatedAt',c.updated_at::text,
      'practicePublished',coalesce(q.status='Published',false),
      'publicationChapterId',case when q.status='Published' then q.chapter_id else null end) as data
    from public.textbook_mcq_candidates c left join public.avs_questions q on q.id=c.id
    where c.book_id=p_book_id and (p_chapter_id is null or
      case when q.status='Published' then q.chapter_id else c.chapter_id end=p_chapter_id)
      and (p_batch_id is null or c.review_batch_id=p_batch_id)
      and case p_filter
        when 'published' then coalesce(q.status='Published',false)
        when 'review' then coalesce(q.status<>'Published',true) and c.review_state<>'rejected'
        when 'rejected' then c.review_state='rejected'
        else true end
  ), page_rows as (select * from selected order by id limit 25 offset (greatest(1,least(10000,p_page))-1)*25)
  select jsonb_build_object('questions',coalesce((select jsonb_agg(data order by id) from page_rows),'[]'::jsonb),
    'total',(select count(*) from selected),'page',greatest(1,least(10000,p_page)),'pageSize',25);
$$;
revoke all on function public.avs_textbook_review_page(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.avs_textbook_review_page(text,text,text,text,integer) to service_role;
revoke all on function public.avs_prepare_textbook_review(jsonb),public.avs_moderate_textbook_mcq(text,text,text,text,jsonb,text,boolean,text,timestamptz),public.avs_textbook_review_batches(text) from public,anon,authenticated;
grant execute on function public.avs_prepare_textbook_review(jsonb),public.avs_moderate_textbook_mcq(text,text,text,text,jsonb,text,boolean,text,timestamptz),public.avs_textbook_review_batches(text) to service_role;
notify pgrst,'reload schema';
commit;
