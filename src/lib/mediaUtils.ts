/**
 * Parses YouTube URLs to extract the 11-character video ID and the start time (in seconds).
 */
export function getYouTubeParams(url: string): { id: string; start: number } {
  if (!url) return { id: '', start: 0 };

  const trimmed = url.trim();

  // 1. Direct 11-character ID (consisting of letters, numbers, hyphens, and underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { id: trimmed, start: 0 };
  }

  let id = '';

  // 2. Try URL object parsing first
  try {
    // If it doesn't have a protocol, prepend https:// to make it a valid URL for the URL parser
    let urlString = trimmed;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    }

    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes('youtu.be')) {
      // youtu.be/<id>
      // pathname starts with '/' so substring(1) is the ID
      const path = parsedUrl.pathname.substring(1);
      const parts = path.split('/');
      if (parts[0]) {
        id = parts[0];
      }
    } else if (hostname.includes('youtube.com') || hostname.includes('youtube-nocookie.com')) {
      const pathname = parsedUrl.pathname;
      
      if (pathname.startsWith('/watch')) {
        // youtube.com/watch?v=<id>
        id = parsedUrl.searchParams.get('v') || '';
      } else if (pathname.startsWith('/embed/')) {
        // youtube.com/embed/<id>
        const parts = pathname.split('/');
        id = parts[2] || '';
      } else if (pathname.startsWith('/v/')) {
        // youtube.com/v/<id>
        const parts = pathname.split('/');
        id = parts[2] || '';
      } else if (pathname.startsWith('/shorts/')) {
        // youtube.com/shorts/<id>
        const parts = pathname.split('/');
        id = parts[2] || '';
      } else if (pathname.startsWith('/live/')) {
        // youtube.com/live/<id>
        const parts = pathname.split('/');
        id = parts[2] || '';
      }
    }
  } catch (e) {
    // Fallback if URL parsing fails
    console.warn("Failed to parse URL, using regex fallback", e);
  }

  // 3. Fallback regexes if URL parsing didn't find a valid 11-char ID
  if (!id || id.length !== 11) {
    // Try matching '/shorts/<id>', '/live/<id>', '/embed/<id>', '/v/<id>'
    const pathMatch = trimmed.match(/\/(?:shorts|live|embed|v)\/([a-zA-Z0-9_-]{11})/i);
    if (pathMatch) {
      id = pathMatch[1];
    } else {
      // Try matching '?v=<id>' or '&v=<id>'
      const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
      if (queryMatch) {
        id = queryMatch[1];
      } else {
        // Try matching 'youtu.be/<id>'
        const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
        if (shortMatch) {
          id = shortMatch[1];
        }
      }
    }
  }

  // Ensure extracted ID is exactly 11 characters, otherwise reset it
  if (id && id.length !== 11) {
    id = '';
  }

  // Extract start time in seconds
  let start = 0;
  
  // 1. Check for standard t=XX or start=XX parameters (seconds)
  const tMatch = trimmed.match(/[?&]t=(\d+)/);
  const startMatch = trimmed.match(/[?&]start=(\d+)/);
  
  if (tMatch) {
    start = parseInt(tMatch[1], 10);
  } else if (startMatch) {
    start = parseInt(startMatch[1], 10);
  } else {
    // 2. Check for format like t=1m30s
    const timeFormatMatch = trimmed.match(/[?&]t=(?:(\d+)m)?(?:(\d+)s)?/);
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
export function getGoogleDriveParams(url: string): { isDrive: boolean; id: string; previewUrl: string; streamUrl: string } {
  if (!url) return { isDrive: false, id: '', previewUrl: '', streamUrl: '' };

  const isDrive = url.includes('drive.google.com');
  const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/) || url.match(/[?&]id=([^&]+)/);
  const id = fileIdMatch ? fileIdMatch[1] : '';
  const previewUrl = id ? `https://drive.google.com/file/d/${id}/preview` : '';
  const streamUrl = id ? `https://docs.google.com/uc?export=download&id=${id}` : '';

  return { isDrive, id, previewUrl, streamUrl };
}

/**
 * Normalizes any image/video/youtube/drive URL to identify its media type and direct play source.
 */
export function getMediaSource(url: string, explicitType?: 'image' | 'video' | 'youtube') {
  if (!url) return { type: 'image' as const, src: '' };

  const drive = getGoogleDriveParams(url);
  if (drive.isDrive) {
    if (explicitType === 'video') {
      return { type: 'video' as const, src: drive.streamUrl };
    }
    if (explicitType === 'image') {
      return { type: 'image' as const, src: `https://lh3.googleusercontent.com/d/${drive.id}` };
    }
    // Google Drive videos should be embedded via iframe for reliable playback (avoids virus scan blocks)
    return { type: 'drive' as const, src: drive.previewUrl };
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
