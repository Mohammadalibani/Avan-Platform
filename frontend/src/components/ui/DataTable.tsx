import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
  className?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  onEdit,
  onDelete,
  loading = false,
  searchPlaceholder = 'جستجو...',
  actions,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // فیلتر بر اساس جستجو
  const filteredData = data.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return columns.some((col) => {
      // ✅ اگر render وجود دارد، از آن استفاده کن
      if (col.render) {
        const rendered = col.render(item);
        if (typeof rendered === 'string') {
          return rendered.toLowerCase().includes(searchLower);
        }
        return false;
      }
      // ✅ از key برای دسترسی به مقدار استفاده کن
      const value = item[col.key as string];
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });

  // مرتب‌سازی
  const sortedData = [...filteredData];
  if (sortField) {
    sortedData.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  // صفحه‌بندی
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-md overflow-hidden', className)}>
      {/* تولبار */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={10}>۱۰</option>
            <option value={25}>۲۵</option>
            <option value={50}>۵۰</option>
            <option value={100}>۱۰۰</option>
          </select>
          <span className="text-sm text-slate-500">رکورد</span>
        </div>
      </div>

      {/* جدول */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-right text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.title}
                    {col.sortable !== false && sortField === col.key && (
                      <span className="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">عملیات</th>}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                  هیچ داده‌ای یافت نشد
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-slate-700">
                      {col.render ? col.render(item) : item[col.key as string] ?? '-'}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            نمایش {startIndex + 1} تا {Math.min(endIndex, sortedData.length)} از {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm transition-colors',
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;