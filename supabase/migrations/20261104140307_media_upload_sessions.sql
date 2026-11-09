-- Durable private upload manifests. A lesson is saved separately after upload.
create table public.learning_media_uploads (
  id text primary key,
  created_by text not null references public.avs_users(id),
  name text not null check(length(name) between 1 and 200),
  fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
  mime text not null check(mime in ('video/mp4','application/pdf','image/jpeg','image/png')),
  size_bytes bigint not null check(size_bytes between 1 and 536870912),
  part_bytes integer not null default 4194304 check(part_bytes=4194304),
  status text not null default 'uploading' check(status in ('uploading','complete')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index learning_media_uploads_owner on public.learning_media_uploads(created_by,created_at desc);
alter table public.learning_media_uploads enable row level security;
revoke all on public.learning_media_uploads from anon,authenticated;
grant all on public.learning_media_uploads to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('learning-upload-parts','learning-upload-parts',false,4194304,array['application/octet-stream'])
on conflict(id) do nothing;
