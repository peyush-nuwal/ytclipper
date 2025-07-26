import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface VideoSummary {
  video_id: string;
  timestamp_count: number;
  first_timestamp?: number;
  last_timestamp?: number;
  earliest_created: string;
  latest_created: string;
}

export interface GetUserVideosResponse {
  videos: VideoSummary[];
}

export const injectedVideosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserVideos: builder.query<
      UniversalResponse<GetUserVideosResponse>,
      void
    >({
      query: () => '/timestamps/videos',
    }),
  }),
});

export const { useGetUserVideosQuery } = injectedVideosApi;
