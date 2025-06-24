import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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

const fetchTasks = async (keyword: string) => {
  const token = sessionStorage.getItem('accessToken');
  const res = await axios.get('http://localhost:3000/admin/tasks', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      keyword: keyword.trim(),
    },
  });
  return res.data;
};

const TaskList = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data: tasks = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['tasks', debouncedSearch],
    queryFn: () => fetchTasks(debouncedSearch),
    enabled: !!debouncedSearch || search === '',
    placeholderData: (prev) => prev,
  });


  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-[#243874]">
        Tất cả task trong hệ thống
      </h2>

      <input
        type="text"
        placeholder="Tìm theo tiêu đề, Intern, Mentor, ID..."
        className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading || isFetching ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="border px-4 py-2 text-left">ID</th>
                <th className="border px-4 py-2 text-left">Tiêu đề</th>
                <th className="border px-4 py-2 text-left">Intern</th>
                <th className="border px-4 py-2 text-left">Mentor</th>
                <th className="border px-4 py-2 text-left">Trạng thái</th>
                <th className="border px-4 py-2 text-left">Hạn chót</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {tasks.map((task: Task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{task.id}</td>
                  <td className="border px-4 py-2">{task.title}</td>
                  <td className="border px-4 py-2">
                    {task.assignedTo?.name || '---'} (#{task.assignedTo?.id || '-'})
                  </td>
                  <td className="border px-4 py-2">
                    {task.assignedBy?.name || '---'} (#{task.assignedBy?.id || '-'})
                  </td>
                  <td className="border px-4 py-2 capitalize">{task.status}</td>
                  <td className="border px-4 py-2">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskList;
