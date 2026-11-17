import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./ui.css";

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  emptyMessage = "No records found.",
  isLoading = false,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInternalSearch(val);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(val);
    }
  };

  // Client-side filtering if onSearch is not provided
  const filteredData = useMemo(() => {
    if (onSearch || !internalSearch.trim()) return data;
    const q = internalSearch.toLowerCase().trim();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, internalSearch, onSearch]);

  // Client-side pagination
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validPage, pageSize]);

  return (
    <div className="data-table-container">
      {/* Top Toolbar */}
      <div className="data-table-toolbar">
        <div className="data-table-search-wrap">
          <Search size={15} className="data-table-search-icon" />
          <input
            type="text"
            className="data-table-search-input"
            placeholder={searchPlaceholder}
            value={internalSearch}
            onChange={handleSearchChange}
          />
        </div>

        {filters && <div className="data-table-filters-slot">{filters}</div>}
      </div>

      {/* Table Wrapper */}
      <div className="data-table-wrapper">
        <table className="data-table-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || col.accessor || idx}
                  className="data-table-th"
                  style={col.style || {}}
                >
                  {col.header || col.title || col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="data-table-tr">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="data-table-td">
                      <div
                        className="data-table-skeleton-bar"
                        style={{ width: `${60 + ((rIdx + cIdx) % 4) * 10}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || row._id || rIdx} className="data-table-tr">
                  {columns.map((col, cIdx) => {
                    let cellVal = null;
                    if (typeof col.accessor === "function") {
                      cellVal = col.accessor(row);
                    } else if (col.accessor) {
                      cellVal = row[col.accessor];
                    } else if (col.key) {
                      cellVal = row[col.key];
                    }

                    return (
                      <td key={col.key || col.accessor || cIdx} className="data-table-td" style={col.cellStyle || {}}>
                        {col.render ? col.render(cellVal, row) : (cellVal ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      {!isLoading && totalItems > 0 && (
        <div className="data-table-pagination">
          <div className="data-table-pagination-info">
            <span>
              Showing {Math.min((validPage - 1) * pageSize + 1, totalItems)}–
              {Math.min(validPage * pageSize, totalItems)} of {totalItems}
            </span>
            <select
              className="data-table-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="data-table-pagination-controls">
            <button
              className="data-table-page-btn"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              className="data-table-page-btn"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ margin: "0 6px", fontSize: "12px", fontWeight: 600 }}>
              Page {validPage} of {totalPages}
            </span>

            <button
              className="data-table-page-btn"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              className="data-table-page-btn"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
