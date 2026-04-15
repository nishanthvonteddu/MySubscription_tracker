"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { Upload, UploadListResponse } from "@/types";

const uploadKeys = {
  history: ["uploads", "history"] as const,
  status: (uploadId: number) => ["uploads", "status", uploadId] as const,
};

function compareUploadsByRecency(left: Upload, right: Upload) {
  const timestampDelta = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

  if (timestampDelta !== 0) {
    return timestampDelta;
  }

  return right.id - left.id;
}

export function upsertUploadInHistory(
  current: UploadListResponse | undefined,
  upload: Upload,
): UploadListResponse {
  const existingItems = current?.items ?? [];
  const alreadyPresent = existingItems.some((item) => item.id === upload.id);
  const items = [upload, ...existingItems.filter((item) => item.id !== upload.id)].sort(compareUploadsByRecency);

  return {
    items,
    total: alreadyPresent ? current?.total ?? items.length : (current?.total ?? existingItems.length) + 1,
  };
}

export function removeUploadFromHistory(
  current: UploadListResponse | undefined,
  uploadId: number,
): UploadListResponse | undefined {
  if (!current) {
    return current;
  }

  const items = current.items.filter((item) => item.id !== uploadId);
  const removedCount = current.items.length - items.length;

  if (removedCount === 0) {
    return current;
  }

  return {
    items,
    total: Math.max(0, current.total - removedCount),
  };
}

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage uploads.");
  }

  return accessToken;
}

export function useUploadHistory() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getUploads(accessToken!),
    queryKey: uploadKeys.history,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((item) => item.status === "queued" || item.status === "processing")
        ? 2_000
        : false;
    },
  });
}

export function useUploadStatus(uploadId: number | null) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: Boolean(accessToken) && uploadId !== null,
    queryFn: async () => {
      const upload = await apiClient.getUploadStatus(accessToken!, uploadId!);
      queryClient.setQueryData<UploadListResponse>(uploadKeys.history, (current) =>
        upsertUploadInHistory(current, upload),
      );
      return upload;
    },
    queryKey: uploadId === null ? ["uploads", "status", "idle"] : uploadKeys.status(uploadId),
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const upload = query.state.data;
      return upload?.status === "queued" || upload?.status === "processing" ? 1_250 : false;
    },
  });
}

export function useCreateUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      apiClient.uploadFile(token, file, onProgress),
    onSuccess: (upload) => {
      queryClient.setQueryData(uploadKeys.status(upload.id), upload);
      queryClient.setQueryData<UploadListResponse>(uploadKeys.history, (current) =>
        upsertUploadInHistory(current, upload),
      );
      void queryClient.invalidateQueries({ queryKey: uploadKeys.status(upload.id) });
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
    },
  });
}

export function useDeleteUpload() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadId: number) => apiClient.deleteUpload(token, uploadId),
    onSuccess: (_, uploadId) => {
      queryClient.setQueryData<UploadListResponse | undefined>(uploadKeys.history, (current) =>
        removeUploadFromHistory(current, uploadId),
      );
      void queryClient.invalidateQueries({ queryKey: uploadKeys.history });
      queryClient.removeQueries({ queryKey: uploadKeys.status(uploadId) });
    },
  });
}

export function mergeSelectedUpload(
  selectedUploadId: number | null,
  historyItems: Upload[],
  selectedUploadStatus: Upload | undefined,
) {
  if (selectedUploadStatus && selectedUploadId === selectedUploadStatus.id) {
    return selectedUploadStatus;
  }

  return historyItems.find((item) => item.id === selectedUploadId) ?? historyItems[0] ?? null;
}
