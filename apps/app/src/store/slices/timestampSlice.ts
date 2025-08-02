import { type Timestamp } from '@/services/timestamps';
import { createSlice } from '@reduxjs/toolkit';

export interface TimestampState {
  timestamps: Timestamp[];
  currentVideoId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  currentTimestamp: number;
  videoTitle: string | null;
}

const initialState: TimestampState = {
  timestamps: [],
  currentVideoId: null,
  isLoading: false,
  error: null,
  lastFetch: null,
  videoTitle: null,
  currentTimestamp: 0,
};

const timestampSlice = createSlice({
  name: 'timestamps',
  initialState,
  reducers: {
    setTimestamps: (state, action) => {
      state.timestamps = action.payload;
      state.lastFetch = Date.now();
    },
    setCurrentVideoId: (state, action) => {
      state.currentVideoId = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCurrentTimestamp: (state, action) => {
      state.currentTimestamp = action.payload;
    },
    setVideoTitle: (state, action) => {
      state.videoTitle = action.payload;
    },
  },
  extraReducers: () => {},
});

export const { setTimestamps, setCurrentTimestamp, setVideoTitle } =
  timestampSlice.actions;
export default timestampSlice.reducer;
