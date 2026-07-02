function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeEmbed({
  url,
  title,
}: {
  url: string;
  title?: string;
}) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title={title ?? "YouTube video"}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="h-full w-full"
    />
  );
}
