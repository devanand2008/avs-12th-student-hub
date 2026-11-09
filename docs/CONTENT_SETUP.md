# Adding handwritten notes and video lessons

The latest verified supplied library contains 57 PDF notes and 179 unique video lessons (236 resources). See the dated materials reports for the source inventory. Run the [material import](MATERIAL_IMPORT.md) to publish these in Supabase. Administrators can add more resources using the following workflow.

## Connect durable content storage

1. Create a Supabase project and run `supabase/migrations/20261006_learning_resources.sql` in its SQL editor.
2. Follow [database setup](SUPABASE_SETUP.md), including `20261008_learning_video_uploads.sql` for MP4 uploads. Set the project URL and server secret/service-role key privately.
3. Restart the app. The admin content page should show connected storage instead of the temporary preview notice.

The original migration creates `learning_resources` and the legacy public `learning-materials` bucket. Existing public URLs remain public. Apply `20261104140307_media_upload_sessions.sql` for the new private resumable uploader: files are split into 4 MiB objects in `learning-upload-parts` and tracked in `learning_media_uploads`. Only administrators can upload; students can stream completed files referenced by a published resource. All uploads use the project’s storage and bandwidth quota.

## Add notes

Sign in as admin, open `/admin/notes`, and choose **Add notes**. Select the chapter, language, title and academic year. Upload a PDF, JPG or PNG (maximum 512 MiB), or enter an existing HTTPS file URL. PDF page count is read automatically; check it before saving. For a multipage handwritten notebook, combine the scans into a PDF. A standalone image is one page.

Save a draft to review it, then publish. Students only see published resources. Archive removes a resource from their library. Delete removes its metadata; uploaded storage files are retained and can be removed separately in Supabase when no longer needed.

## Add videos

Open `/admin/videos`. Choose YouTube, a hosted MP4 URL, or a NotebookLM share link. You can also upload an MP4 up to 512 MiB using private resumable storage. Duration is read automatically. For larger files or insufficient storage quota, use an authorised external host. Use an HTTPS URL the browser can play, and enable embedding for YouTube videos. NotebookLM lessons open at their source and follow Google's sharing permissions.

Enter the chapter, teacher, language and duration, then save a draft or publish. Native video playback saves progress; YouTube and NotebookLM lessons offer a manual completion control.

## Preview without Supabase

Development and explicitly enabled demo mode support temporary metadata using hosted URLs. Uploaded files require Supabase. Preview metadata disappears when the server restarts. Production saving fails without Supabase unless `ENABLE_DEMO_DATA=true` explicitly enables preview mode.

## Current boundaries

Content and student learning records now persist in Supabase when configured. Explicit demo mode uses temporary memory. Uploading a note does not automatically OCR it or add it to the AI helper; approved content ingestion is still needed for those materials. The Supabase source-excerpt table starts empty, and the reviewed question bank must be populated by administrators.

## Resume and database sync

Use **Cancel upload** to stop a stalled transfer without deleting completed parts. Each upload request has a 90-second deadline. If an upload is interrupted, choose the same original file again on the same browser. Completed parts are reused. Files over the current quota cannot finish; the 512 MiB per-file cap does not increase the plan quota. Saving the upload does not publish it: choose Save draft or Publish after checking the title, chapter, medium and permissions. Closing the form does not delete uploaded parts. Unattached/stale upload cleanup is a manual administrator task.

Use **Save supplied library to database** on either admin content page to insert missing supplied records. Existing administrator edits and archived records take precedence; retries do not create duplicates.

Open `/resources/guides` for the separately curated authorised PDF references. Complete originals preserve their licence/attribution; these references are supplementary English reading, not complete TN examination guides.
