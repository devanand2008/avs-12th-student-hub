import type { HandwrittenNote, VideoLesson } from "@/types";
import {
  getSupabase,
  backendMode,
  BackendUnavailableError,
} from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export type LearningResource = HandwrittenNote | VideoLesson;
export type ResourceKind = "note" | "video";
type StoredResource = { kind: ResourceKind; resource: LearningResource };
declare global {
  var __AVS_CONTENT__: Map<string, StoredResource> | undefined;
}
const previewStore = (global.__AVS_CONTENT__ ??= new Map<
  string,
  StoredResource
>());

function storageClient() {
  if (backendMode() === "unconfigured") throw new BackendUnavailableError();
  return getSupabase();
}
export function contentStorageMode() {
  return storageClient() ? "supabase" : "preview";
}
export async function listResources(
  kind: ResourceKind,
  includeDrafts = false,
): Promise<LearningResource[]> {
  const client = storageClient();
  let resources: LearningResource[];
  if (client) {
    const { data, error } = await client
      .from("learning_resources")
      .select("resource")
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(
        "Content storage is unavailable. Check the learning_resources migration.",
      );
    resources = (data || []).map((row) => row.resource as LearningResource);
  } else
    resources = Array.from(previewStore.values())
      .filter((row) => row.kind === kind)
      .map((row) => row.resource)
      .reverse();
  return includeDrafts
    ? resources
    : resources.filter((resource) => resource.isPublished);
}
export async function saveResource(
  kind: ResourceKind,
  resource: LearningResource,
) {
  const client = storageClient();
  if (client) {
    const { error } = await client
      .from("learning_resources")
      .upsert({ id: resource.id, kind, resource });
    if (error)
      throw new Error(
        "Could not save this resource. Check your Supabase content configuration.",
      );
  } else {
    if (backendMode() === "unconfigured")
      throw new Error("Configure Supabase before saving production content.");
    previewStore.set(resource.id, { kind, resource });
  }
  return resource;
}
export async function deleteResource(kind: ResourceKind, id: string) {
  const client = storageClient();
  if (client) {
    const { error } = await client
      .from("learning_resources")
      .delete()
      .eq("id", id)
      .eq("kind", kind);
    if (error) throw new Error("Could not remove this resource.");
  } else previewStore.delete(id);
}
export async function uploadLearningFile(file: File): Promise<string> {
  const client = storageClient();
  if (!client)
    throw new Error(
      "Connect Supabase Storage to upload files. You can use a hosted resource URL in preview mode.",
    );
  const ext =
    file.type === "video/mp4"
      ? "mp4"
      : file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/png"
          ? "png"
          : "jpg";
  const path = `${file.type === "video/mp4" ? "videos" : "notes"}/${randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from("learning-materials")
    .upload(path, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
  if (error)
    throw new Error(
      "File upload failed. Check the learning-materials storage bucket.",
    );
  return client.storage.from("learning-materials").getPublicUrl(path).data
    .publicUrl;
}
