import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface Timestamp {
  id: string;
  video_id: string;
  user_id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTimestampRequest {
  video_id: string;
  timestamp: number;
  title?: string;
  note?: string;
  tags?: string[];
}

export interface GetTimestampsResponse {
  timestamps: Timestamp[];
  video_id: string;
  user_id: string;
}

export interface DeleteTimestampResponse {
  message: string;
  timestamp_id: string;
  user_id: string;
}

export const injectedTimestampsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTimestamp: builder.mutation<Timestamp, CreateTimestampRequest>({
      query: (data) => ({
        url: '/timestamps',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
    getTimestamps: builder.query<
      UniversalResponse<GetTimestampsResponse>,
      string
    >({
      query: (videoId) => `/timestamps/${videoId}`,
    }),
    deleteTimestamp: builder.mutation<DeleteTimestampResponse, string>({
      query: (timestampId) => ({
        url: `/timestamps/${timestampId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useCreateTimestampMutation,
  useGetTimestampsQuery,
  useDeleteTimestampMutation,
} = injectedTimestampsApi;
