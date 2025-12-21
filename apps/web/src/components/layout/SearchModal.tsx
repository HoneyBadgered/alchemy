import React from "react";

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const isLoading = false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="w-full max-w-2xl rounded bg-white shadow-lg">
        <div className="p-4">
          <label htmlFor="search" className="sr-only">Search</label>
          <input
            id="search"
            className="w-full rounded border px-3 py-2"
            type="search"
            placeholder="Search products, articles, and more..."
          /> {/* <-- input must be self-closed */}
          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-8 text-center">Loading…</div>
            )}
            {/* results go here */}
          </div>
        </div>
        <div className="flex justify-end border-t p-3">
          <button onClick={onClose} className="rounded bg-gray-100 px-3 py-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}