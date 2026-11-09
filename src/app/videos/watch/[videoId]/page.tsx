import VideoLibrary from "@/components/learning/VideoLibrary";
export default async function WatchVideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  return <VideoLibrary key={videoId} watchId={videoId} />;
}
