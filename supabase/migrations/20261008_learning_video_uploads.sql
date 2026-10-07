-- Keep the existing 15 MB upload limit and allow lesson MP4 files.
update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'video/mp4']
where id = 'learning-materials';
