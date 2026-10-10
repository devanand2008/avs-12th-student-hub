begin;

-- Student catalog counts must use the same published chapter as quiz selection,
-- including when a retained question differs from an extraction candidate.
create or replace function public.avs_textbook_mcq_catalog() returns jsonb
language sql stable set search_path = '' as $$
  with entries as (
    select c.book_id,case when q.status='Published' then q.chapter_id else c.chapter_id end as chapter_id,c.id,q.status
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

revoke all on function public.avs_textbook_mcq_catalog() from public,anon,authenticated;
grant execute on function public.avs_textbook_mcq_catalog() to service_role;

-- Repair only the ten retained Electronics questions independently checked
-- against CHAPTER 2 (PDF 55, key 56) and CHAPTER 4 (PDF 121, key 122).
-- No wording, option, answer, source page or moderation status is changed.
update public.avs_questions q
set data=jsonb_set(q.data,'{chapterId}',to_jsonb(c.chapter_id))
from public.textbook_mcq_candidates c
where q.id=c.id
  and c.book_id='12-basic-electronics-engineering-english-983efd90'
  and q.data->>'sourceTextbookId'=c.book_id
  and q.status='Published' and q.data->>'answerVerification'='Textbook Answer Key'
  and q.chapter_id='tb-12-basic-electronics-engineering-english-983efd90-ch-9'
  and ((q.data->>'sourcePage'='55' and c.data->>'page'='55' and c.chapter_id='tb-12-basic-electronics-engineering-english-983efd90-ch-2')
    or (q.data->>'sourcePage'='121' and c.data->>'page'='121' and c.chapter_id='tb-12-basic-electronics-engineering-english-983efd90-ch-4'))
  and q.id in (
    'textbook-q-12-basic-electronics-engineering-english-983efd90-17f5a55810b75b89',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-321e11ff280bf48c',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-3d3220a7bcaa1b71',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-5af0907d440a8fb2',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-72ee75c5f7cbeed1',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-9cc4d3dd53d75721',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-a3f19eff30025340',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-b45f276ec40a7c8c',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-ec54bc0ec08a8b5a',
    'textbook-q-12-basic-electronics-engineering-english-983efd90-ffb031446294e6a0'
  );

update public.avs_curriculum ch
set data=jsonb_set(ch.data,'{totalMcqs}',to_jsonb((select count(*)::integer from public.avs_questions q where q.chapter_id=ch.id and q.status='Published')))
where ch.kind='chapter' and ch.id in (
  'tb-12-basic-electronics-engineering-english-983efd90-ch-2',
  'tb-12-basic-electronics-engineering-english-983efd90-ch-4',
  'tb-12-basic-electronics-engineering-english-983efd90-ch-9'
);

insert into public.avs_schema_versions(version) values('20261010_textbook_chapter_consistency') on conflict do nothing;
commit;
