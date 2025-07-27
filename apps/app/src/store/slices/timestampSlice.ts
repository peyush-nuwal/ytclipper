import { type Timestamp } from '@/services/timestamps';
import { createSlice } from '@reduxjs/toolkit';

export interface TimestampState {
  timestamps: Timestamp[];
  currentVideoId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: TimestampState = {
  timestamps: [],
  currentVideoId: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

const timestampSlice = createSlice({
  name: 'timestamps',
  initialState,
  reducers: {},
  extraReducers: () => {},
});

export default timestampSlice.reducer;
