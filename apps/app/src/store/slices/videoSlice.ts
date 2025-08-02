import { type VideoSummary } from '@/services/videos';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VideoState {
  videos: VideoSummary[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: VideoState = {
  videos: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<VideoSummary[]>) => {
      state.videos = action.payload;
      state.lastFetch = Date.now();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateVideoMetadata: (
      state,
      action: PayloadAction<{
        videoId: string;
        title: string;
        youtubeUrl: string;
      }>,
    ) => {
      const { videoId, title, youtubeUrl } = action.payload;
      const videoIndex = state.videos.findIndex(
        (video) => video.video_id === videoId,
      );

      if (videoIndex !== -1) {
        state.videos[videoIndex].title = title;
        state.videos[videoIndex].youtube_url = youtubeUrl;
      }
    },
    addVideo: (state, action: PayloadAction<VideoSummary>) => {
      const existingIndex = state.videos.findIndex(
        (video) => video.video_id === action.payload.video_id,
      );
      if (existingIndex === -1) {
        state.videos.unshift(action.payload);
      } else {
        state.videos[existingIndex] = action.payload;
      }
    },
  },
  extraReducers: () => {},
});

export const {
  setVideos,
  setLoading,
  setError,
  updateVideoMetadata,
  addVideo,
} = videoSlice.actions;

// Selectors
export const selectVideos = (state: { videos: VideoState }) =>
  state.videos.videos;
export const selectVideoById = (
  state: { videos: VideoState },
  videoId: string,
) => state.videos.videos.find((video) => video.video_id === videoId);
export const selectVideoHasMetadata = (
  state: { videos: VideoState },
  videoId: string,
) => {
  const video = state.videos.videos.find((video) => video.video_id === videoId);
  return (
    video &&
    video.title &&
    video.title !== `Video ${videoId}` &&
    video.duration &&
    video.duration > 0
  );
};

export default videoSlice.reducer;
