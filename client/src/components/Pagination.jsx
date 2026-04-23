import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable Pagination component.
 * Props:
 *   page        — current page (1-based)
 *   totalPages  — total number of pages
 *   onChange    — (newPage: number) => void
 */
const Pagination = ({ page, totalPages, onChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  // Build page number window: always show first, last, current ±1
  const pages = [];
  const addPage = (n) => {
    if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
  };

  addPage(1);
  addPage(page - 1);
  addPage(page);
  addPage(page + 1);
  addPage(totalPages);
  pages.sort((a, b) => a - b);

  // Insert null for gaps
  const items = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push(null); // gap
    items.push(p);
  });

  return (
    <div style={styles.wrap}>
      {/* Prev */}
      <button
        style={{
          ...styles.btn,
          ...(page === 1 ? styles.btnDisabled : styles.btnActive),
        }}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>

      {/* Page numbers */}
      {items.map((item, idx) =>
        item === null ? (
          <span key={`gap-${idx}`} style={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={item}
            style={{
              ...styles.btn,
              ...(item === page ? styles.btnCurrent : styles.btnActive),
            }}
            onClick={() => item !== page && onChange(item)}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      {/* Next */}
      <button
        style={{
          ...styles.btn,
          ...(page >= totalPages ? styles.btnDisabled : styles.btnActive),
        }}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

const styles = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    padding: "1.25rem 1rem",
    borderTop: "1px solid #f1f5f9",
  },
  btn: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0.5rem",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  btnActive: {
    background: "#fff",
    color: "#334155",
    borderColor: "#e2e8f0",
  },
  btnCurrent: {
    background: "#f97316",
    color: "#fff",
    borderColor: "#f97316",
    cursor: "default",
  },
  btnDisabled: {
    background: "#f8fafc",
    color: "#cbd5e1",
    borderColor: "#f1f5f9",
    cursor: "not-allowed",
  },
  ellipsis: {
    minWidth: 24,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: 600,
    userSelect: "none",
  },
};

export default Pagination;
