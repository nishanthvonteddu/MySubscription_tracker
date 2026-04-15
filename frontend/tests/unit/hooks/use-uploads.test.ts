import { describe, expect, it } from "vitest";

import {
  mergeSelectedUpload,
  removeUploadFromHistory,
  upsertUploadInHistory,
} from "@/hooks/use-uploads";
import type { Upload, UploadListResponse } from "@/types";

function buildUpload(overrides: Partial<Upload> = {}): Upload {
  const id = overrides.id ?? 1;
  const createdAt = overrides.created_at ?? `2026-04-15T12:${String(id).padStart(2, "0")}:00.000Z`;

  return {
    content_type: "text/csv",
    created_at: createdAt,
    error_message: null,
    file_name: `statement-${id}.csv`,
    file_size: 2048,
    id,
    last_synced_at: createdAt,
    provider: "pending",
    source_type: "upload_csv",
    status: "queued",
    transaction_count: 0,
    updated_at: createdAt,
    ...overrides,
  };
}

function buildHistory(items: Upload[]): UploadListResponse {
  return {
    items,
    total: items.length,
  };
}

describe("use-uploads helpers", () => {
  it("inserts new uploads into history in newest-first order", () => {
    const olderUpload = buildUpload({ id: 1, created_at: "2026-04-15T12:01:00.000Z" });
    const newerUpload = buildUpload({ id: 2, created_at: "2026-04-15T12:02:00.000Z" });
    const newestUpload = buildUpload({ id: 3, created_at: "2026-04-15T12:03:00.000Z" });

    const next = upsertUploadInHistory(buildHistory([newerUpload, olderUpload]), newestUpload);

    expect(next.items.map((item) => item.id)).toEqual([3, 2, 1]);
    expect(next.total).toBe(3);
  });

  it("replaces existing uploads without double counting history totals", () => {
    const queuedUpload = buildUpload({ id: 7, status: "queued" });
    const completedUpload = buildUpload({ id: 7, status: "completed", transaction_count: 4 });

    const next = upsertUploadInHistory(buildHistory([queuedUpload]), completedUpload);

    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({
      id: 7,
      status: "completed",
      transaction_count: 4,
    });
    expect(next.total).toBe(1);
  });

  it("removes deleted uploads from cached history", () => {
    const history = buildHistory([buildUpload({ id: 2 }), buildUpload({ id: 1 })]);

    const next = removeUploadFromHistory(history, 2);

    expect(next).toEqual(
      buildHistory([
        expect.objectContaining({
          id: 1,
        }) as Upload,
      ]),
    );
  });

  it("keeps a selected upload visible from live status data before history catches up", () => {
    const olderUpload = buildUpload({ id: 1, file_name: "older.csv" });
    const liveUpload = buildUpload({ id: 2, file_name: "fresh.csv", status: "processing" });

    const selected = mergeSelectedUpload(2, [olderUpload], liveUpload);

    expect(selected).toMatchObject({
      id: 2,
      file_name: "fresh.csv",
      status: "processing",
    });
  });
});
