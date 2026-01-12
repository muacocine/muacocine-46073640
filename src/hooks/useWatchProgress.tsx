import { useState, useEffect, useCallback } from 'react';

export interface WatchProgress {
  mediaId: number;
  mediaType: string;
  currentTime: number;
  duration: number;
  season?: number;
  episode?: number;
  updatedAt: string;
}

const PROGRESS_KEY = 'muaco_watch_progress';

export const getWatchProgress = (): WatchProgress[] => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveWatchProgress = (progress: WatchProgress): void => {
  const progresses = getWatchProgress();
  const index = progresses.findIndex(p => 
    p.mediaId === progress.mediaId && 
    p.mediaType === progress.mediaType &&
    p.season === progress.season &&
    p.episode === progress.episode
  );

  if (index >= 0) {
    progresses[index] = progress;
  } else {
    progresses.unshift(progress);
  }

  // Keep only last 100 items
  const trimmed = progresses.slice(0, 100);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(trimmed));
};

export const getProgressForMedia = (
  mediaId: number, 
  mediaType: string, 
  season?: number, 
  episode?: number
): WatchProgress | undefined => {
  const progresses = getWatchProgress();
  return progresses.find(p => 
    p.mediaId === mediaId && 
    p.mediaType === mediaType &&
    p.season === season &&
    p.episode === episode
  );
};

export const clearProgressForMedia = (
  mediaId: number, 
  mediaType: string, 
  season?: number, 
  episode?: number
): void => {
  const progresses = getWatchProgress();
  const filtered = progresses.filter(p => 
    !(p.mediaId === mediaId && 
      p.mediaType === mediaType &&
      p.season === season &&
      p.episode === episode)
  );
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(filtered));
};

export function useWatchProgress(
  mediaId: number,
  mediaType: 'movie' | 'tv',
  season?: number,
  episode?: number
) {
  const [progress, setProgress] = useState<WatchProgress | null>(null);

  useEffect(() => {
    const saved = getProgressForMedia(mediaId, mediaType, season, episode);
    if (saved) {
      setProgress(saved);
    }
  }, [mediaId, mediaType, season, episode]);

  const updateProgress = useCallback((currentTime: number, duration: number) => {
    const newProgress: WatchProgress = {
      mediaId,
      mediaType,
      currentTime,
      duration,
      season,
      episode,
      updatedAt: new Date().toISOString(),
    };
    saveWatchProgress(newProgress);
    setProgress(newProgress);
  }, [mediaId, mediaType, season, episode]);

  const clearProgress = useCallback(() => {
    clearProgressForMedia(mediaId, mediaType, season, episode);
    setProgress(null);
  }, [mediaId, mediaType, season, episode]);

  const resumeTime = progress?.currentTime || 0;
  const progressPercent = progress && progress.duration > 0
    ? Math.round((progress.currentTime / progress.duration) * 100)
    : 0;

  return {
    progress,
    resumeTime,
    progressPercent,
    updateProgress,
    clearProgress,
  };
}
