
/**
 * Client-Side Video Renderer
 * Combines video clips, audio, and effects into downloadable MP4
 */

interface VideoClip {
  url: string;
  duration: number;
}

interface AudioTrack {
  url: string;
  volume?: number;
}

interface RenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  quality?: number;
}

/**
 * Render video package to MP4 using browser APIs
 */
export async function renderVideoToMP4(
  videoClips: VideoClip[],
  voiceover?: AudioTrack,
  music?: AudioTrack,
  options: RenderOptions = {}
): Promise<Blob> {
  const {
    width = 1920,
    height = 1080,
    fps = 30,
    quality = 0.8,
  } = options;

  try {
    console.log('[Video Renderer] Starting MP4 render...', {
      clips: videoClips.length,
      hasVoiceover: !!voiceover,
      hasMusic: !!music,
    });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Canvas context creation failed');
    }

    // Create media recorder
    const stream = canvas.captureStream(fps);
    
    // Create audio context for mixing
    const audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();

    // Load and mix audio
    if (voiceover) {
      const voiceoverNode = await loadAudioTrack(audioContext, voiceover.url);
      const voiceGain = audioContext.createGain();
      voiceGain.gain.value = voiceover.volume || 1.0;
      voiceoverNode.connect(voiceGain).connect(audioDestination);
    }

    if (music) {
      const musicNode = await loadAudioTrack(audioContext, music.url);
      const musicGain = audioContext.createGain();
      musicGain.gain.value = (music.volume || 0.3) * 0.5; // Background music lower
      musicNode.connect(musicGain).connect(audioDestination);
    }

    // Add audio to stream
    if (audioDestination.stream.getAudioTracks().length > 0) {
      audioDestination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }

    // Create media recorder with MP4 support
    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000, // 5 Mbps
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Start recording
    mediaRecorder.start(100); // Record in 100ms chunks

    // Render video clips
    let currentTime = 0;
    for (const clip of videoClips) {
      console.log('[Video Renderer] Rendering clip:', clip.url);
      
      const video = await loadVideoElement(clip.url);
      const clipDuration = clip.duration * 1000; // Convert to ms
      const startTime = Date.now();

      // Play video and render frames
      video.play();
      
      while (Date.now() - startTime < clipDuration) {
        // Draw current video frame
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (videoAspect > canvasAspect) {
          drawHeight = height;
          drawWidth = height * videoAspect;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = width;
          drawHeight = width / videoAspect;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        }

        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }

      video.pause();
      video.remove();
      currentTime += clipDuration;
    }

    // Stop recording
    mediaRecorder.stop();
    audioContext.close();

    // Wait for final chunks
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

    // Create final blob
    const blob = new Blob(chunks, { type: mimeType });
    
    console.log('[Video Renderer] Render complete:', {
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      type: blob.type,
    });

    return blob;

  } catch (error: any) {
    console.error('[Video Renderer] Render failed:', error);
    throw new Error(`Video rendering mislukt: ${error.message}`);
  }
}

/**
 * Load video element from URL
 */
async function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('Video load failed'));

    video.src = url;
    video.load();
  });
}

/**
 * Load audio track into AudioContext
 */
async function loadAudioTrack(
  audioContext: AudioContext,
  url: string
): Promise<AudioBufferSourceNode> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.start(0);

    return source;
  } catch (error) {
    console.warn('[Video Renderer] Audio load failed:', error);
    throw error;
  }
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Estimate render time based on video length
 */
export function estimateRenderTime(totalDuration: number): string {
  const seconds = Math.ceil(totalDuration * 1.5); // ~1.5x real-time
  if (seconds < 60) {
    return `~${seconds} seconden`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} ${minutes === 1 ? 'minuut' : 'minuten'}`;
}
