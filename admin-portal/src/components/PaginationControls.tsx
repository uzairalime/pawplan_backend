"use client";

import type { PaginationMeta } from "@/types/api";

type PaginationControlsProps = {
  meta: PaginationMeta | null;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  return (
    <div
      className="actions"
      style={{ justifyContent: "space-between", marginTop: 16, alignItems: "center" }}
    >
      <span className="subtle">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="actions">
        <button
          className="button secondary"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="button secondary"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
