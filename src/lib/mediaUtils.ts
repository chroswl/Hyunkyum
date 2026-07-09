/**
 * Parses YouTube URLs to extract the 11-character video ID and the start time (in seconds).
 */
export function getYouTubeParams(url: string): { id: string; start: number } {
  if (!url) return { id: '', start: 0 };

  // Extract ID
  const idMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const id = idMatch ? idMatch[1] : '';

  // Extract start time in seconds
  let start = 0;
  
  // 1. Check for standard t=XX or start=XX parameters (seconds)
  const tMatch = url.match(/[?&]t=(\d+)/);
  const startMatch = url.match(/[?&]start=(\d+)/);
  
  if (tMatch) {
    start = parseInt(tMatch[1], 10);
  } else if (startMatch) {
    start = parseInt(startMatch[1], 10);
  } else {
    // 2. Check for format like t=1m30s
    const timeFormatMatch = url.match(/[?&]t=(?:(\d+)m)?(?:(\d+)s)?/);
    if (timeFormatMatch && (timeFormatMatch[1] || timeFormatMatch[2])) {
      const minutes = timeFormatMatch[1] ? parseInt(timeFormatMatch[1], 10) : 0;
      const seconds = timeFormatMatch[2] ? parseInt(timeFormatMatch[2], 10) : 0;
      start = minutes * 60 + seconds;
    }
  }

  return { id, start };
}

/**
 * Checks if a URL is a Google Drive share link and returns the file ID.
 */
export function getGoogleDriveParams(url: string): { isDrive: boolean; id: string; streamUrl: string } {
  if (!url) return { isDrive: false, id: '', streamUrl: '' };

  const isDrive = url.includes('drive.google.com');
  const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/) || url.match(/[?&]id=([^&]+)/);
  const id = fileIdMatch ? fileIdMatch[1] : '';
  const streamUrl = id ? `https://docs.google.com/uc?export=download&id=${id}` : '';

  return { isDrive, id, streamUrl };
}

/**
 * Normalizes any image/video/youtube/drive URL to identify its media type and direct play source.
 */
export function getMediaSource(url: string, explicitType?: 'image' | 'video' | 'youtube') {
  if (!url) return { type: 'image' as const, src: '' };

  const drive = getGoogleDriveParams(url);
  if (drive.isDrive) {
    // Google Drive videos can be directly streamed via native video element using the streamUrl!
    return { type: 'video' as const, src: drive.streamUrl };
  }

  const yt = getYouTubeParams(url);
  if (yt.id || explicitType === 'youtube') {
    return { type: 'youtube' as const, src: url, ytId: yt.id, start: yt.start };
  }

  const isVideo = explicitType === 'video' || url.match(/\.(mp4|webm|ogg)$/i) || url.startsWith('data:video/');
  if (isVideo) {
    return { type: 'video' as const, src: url };
  }

  return { type: 'image' as const, src: url };
}
