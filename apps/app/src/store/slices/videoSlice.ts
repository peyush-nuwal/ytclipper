import { type VideoSummary } from '@/services/videos';
import { createSlice } from '@reduxjs/toolkit';

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
  reducers: {},
  extraReducers: () => {},
});

export default videoSlice.reducer;
