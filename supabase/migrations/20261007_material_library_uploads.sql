-- The supplied notes and videos are under 50 MiB. Keep existing larger limits.
begin;
update storage.buckets
set file_size_limit = greatest(coalesce(file_size_limit, 52428800), 52428800),
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'video/mp4']
where id = 'learning-materials';
insert into public.avs_schema_versions (version)
values ('20261007_material_library_uploads')
on conflict (version) do nothing;
commit;
