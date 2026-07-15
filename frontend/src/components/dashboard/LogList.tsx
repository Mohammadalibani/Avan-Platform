import React, { useState } from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';

interface LogItem {
  id: number;
  time: string;
  message: string;
  badge: 'success' | 'warning' | 'info' | 'danger';
}

interface LogListProps {
  logs: LogItem[];
  onDeleteSelected?: (ids: number[]) => void;
}

const LogList: React.FC<LogListProps> = ({ logs, onDeleteSelected }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setSelectAll(newSet.size === logs.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map(log => log.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (onDeleteSelected && selectedIds.size > 0) {
      onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  };

  const getBadgeClass = (badge: string) => {
    const classes: Record<string, string> = {
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      info: 'bg-blue-100 text-blue-700',
      danger: 'bg-red-100 text-red-700'
    };
    return classes[badge] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="font-bold text-slate-800">📋 لاگ سیستم</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={toggleSelectAll} className="hover:text-slate-700">
              {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <span>انتخاب همه</span>
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
              selectedIds.size > 0 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={14} />
            حذف انتخاب‌ها
          </button>
        </div>
      </div>

      <div className="log-list max-h-[250px] overflow-y-auto border border-slate-200 rounded-xl">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            هیچ لاگی ثبت نشده است
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={selectedIds.has(log.id)}
                onChange={() => toggleSelect(log.id)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 flex items-center gap-3 flex-wrap text-sm">
                <span className="text-slate-400 min-w-[100px]">{log.time}</span>
                <span className="text-slate-700 flex-1">{log.message}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(log.badge)}`}>
                  {log.badge === 'success' && 'موفق'}
                  {log.badge === 'warning' && 'هشدار'}
                  {log.badge === 'info' && 'اطلاعات'}
                  {log.badge === 'danger' && 'خطا'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogList;