import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface VideoSummary {
  video_id: string;
  count: number;
  latest_timestamp?: number;
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
      query: () => '/ytclipper/videos',
    }),
  }),
});

export const { useGetUserVideosQuery } = injectedVideosApi;
