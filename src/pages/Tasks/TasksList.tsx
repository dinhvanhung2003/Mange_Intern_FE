import { useState, useRef, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useVirtualizer } from '@tanstack/react-virtual';
import api from '../../utils/axios';
interface User {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  assignedTo?: User;
  assignedBy?: User;
}

const fetchTasks = async ({ pageParam = 1, keyword = '' }) => {
  const token = sessionStorage.getItem('accessToken');
  const res = await api.get('http://localhost:3000/admin/tasks', {
    headers: { Authorization: `Bearer ${token}` },
    params: { keyword, page: pageParam, limit: 10 },
  });
  return res.data;
};

const TaskList = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['tasks', debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchTasks({ pageParam, keyword: debouncedSearch }),
    getNextPageParam: (lastPage, all) => {
      const totalPages = Math.ceil(lastPage.total / 10);
      const next = all.length + 1;
      return next <= totalPages ? next : undefined;
    },
    initialPageParam: 1,
  });

  const allTasks = data?.pages.flatMap(p => p.data) || [];

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: allTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 50, []),
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      virtualItems.length > 0 &&
      virtualItems[virtualItems.length - 1].index >= allTasks.length - 1
    ) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage, allTasks.length]);
useEffect(() => {
  console.log("Tasks loaded:", allTasks.length);
}, [allTasks.length]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="flex-shrink-0 p-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-4 text-[#243874]">
          Tất cả task trong hệ thống
        </h2>
        <input
          type="text"
          placeholder="Tìm theo tiêu đề, Intern, Mentor, ID..."
          className="w-full border border-gray-300 rounded px-4 py-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {/* Header row */}
        <div className="grid grid-cols-6 bg-gray-100 text-sm text-gray-600 border-b sticky top-0 z-10">
          <div className="px-4 py-2">ID</div>
          <div className="px-4 py-2">Tiêu đề</div>
          <div className="px-4 py-2">Intern</div>
          <div className="px-4 py-2">Mentor</div>
          <div className="px-4 py-2">Trạng thái</div>
          <div className="px-4 py-2">Hạn chót</div>
        </div>

        {/* Virtual rows */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const task = allTasks[virtualRow.index];
            return (
              <div
                key={task.id}
                data-testid="task-row"
                className="grid grid-cols-6 items-center border-b hover:bg-gray-50"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
              >
                <div className="px-4 py-2">{task.id}</div>
                <div className="px-4 py-2">{task.title}</div>
                <div className="px-4 py-2">
                  {task.assignedTo?.name || '---'} (# {task.assignedTo?.id || '-'})
                </div>
                <div className="px-4 py-2">
                  {task.assignedBy?.name || '---'} (# {task.assignedBy?.id || '-'})
                </div>
                <div className="px-4 py-2 capitalize">{task.status}</div>
                <div className="px-4 py-2">
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-center py-2">
        {isFetchingNextPage && (
          <span className="text-blue-600">Đang tải thêm...</span>
        )}
        {!hasNextPage && (
          <span className="text-gray-500 italic">Đã tải toàn bộ task.</span>
        )}
      </div>
    </div>
  );
};

export default TaskList;
