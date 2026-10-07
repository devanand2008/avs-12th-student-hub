# Adding handwritten notes and video lessons

The supplied `book's` folder contains 13 PDF notes and 5 Tamil MP4 lessons. Run the [material import](MATERIAL_IMPORT.md) to publish these in Supabase. Administrators can add more resources using the following workflow.

## Connect durable content storage

1. Create a Supabase project and run `supabase/migrations/20261006_learning_resources.sql` in its SQL editor.
2. Follow [database setup](SUPABASE_SETUP.md), including `20261008_learning_video_uploads.sql` for MP4 uploads. Set the project URL and server secret/service-role key privately.
3. Restart the app. The admin content page should show connected storage instead of the temporary preview notice.

The migration creates the `learning_resources` table and `learning-materials` bucket. Files in this bucket have public URLs: only upload material you are allowed to distribute publicly. Student authentication protects the library pages, but does not make these file URLs private.

## Add notes

Sign in as admin, open `/admin/notes`, and choose **Add notes**. Select the chapter, language, title and academic year. Upload a PDF, JPG or PNG (maximum 50 MiB), or enter an existing HTTPS file URL. Apply `20261007_material_library_uploads.sql` after the other migrations to enable this limit. For a multipage handwritten notebook, combine the scans into a PDF and enter its page count. A standalone image is one page.

Save a draft to review it, then publish. Students only see published resources. Archive removes a resource from their library. Delete removes its metadata; uploaded storage files are retained and can be removed separately in Supabase when no longer needed.

## Add videos

Open `/admin/videos`. Choose YouTube, a hosted MP4 URL, or a NotebookLM share link. You can also upload an MP4 up to 50 MiB to Supabase Storage; larger video files need an external host. Use an HTTPS URL the browser can play, and enable embedding for YouTube videos. NotebookLM lessons open at their source and follow Google's sharing permissions.

Enter the chapter, teacher, language and duration, then save a draft or publish. Native video playback saves progress; YouTube and NotebookLM lessons offer a manual completion control.

## Preview without Supabase

Development and explicitly enabled demo mode support temporary metadata using hosted URLs. Uploaded files require Supabase. Preview metadata disappears when the server restarts. Production saving fails without Supabase unless `ENABLE_DEMO_DATA=true` explicitly enables preview mode.

## Current boundaries

Content and student learning records now persist in Supabase when configured. Explicit demo mode uses temporary memory. Uploading a note does not automatically OCR it or add it to the AI helper; approved content ingestion is still needed for those materials. The Supabase source-excerpt table starts empty, and the reviewed question bank must be populated by administrators.
