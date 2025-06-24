import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import DescriptionViewerDialog from '../../components/DesciptionTask';
import { useAssignmentStore } from '../../stores/useAssignmentStore';
const socket = io('http://localhost:3000');

export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  // const [assignment, setAssignment] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const taskSearchCache = new Map<string, any[]>();


  const { assignment } = useAssignmentStore();

  useEffect(() => {
    const delay = setTimeout(() => {
      api
        .get('/interns/tasks', {
          params: { search: search.trim() },
        })
        .then((res) => setTasks(res.data))
        .catch((err) => console.error('Lỗi khi tìm task:', err));
    }, 400); // debounce 400ms

    return () => clearTimeout(delay);
  }, [search]);



  useEffect(() => {
    if (!debouncedSearch) return;

    // Nếu đã có trong cache, dùng luôn
    if (taskSearchCache.has(debouncedSearch)) {
      setTasks(taskSearchCache.get(debouncedSearch)!);
      return;
    }

    // Nếu chưa có, gọi API
    api.get('/interns/tasks', {
      params: { search: debouncedSearch },
    })
      .then((res) => {
        setTasks(res.data);
        taskSearchCache.set(debouncedSearch, res.data); // Lưu vào cache
      })
      .catch((err) => console.error('Lỗi khi tìm task:', err));
  }, [debouncedSearch]);



  // const filteredTasks = tasks.filter((task) => {
  //   const combined = `
  //   ${task.title}
  //   ${task.description}
  //   ${task.status}
  //   ${task.mentor?.name || ''}
  //   ${task.school || ''}
  //   ${task.dueDate || ''}
  // `.toLowerCase();

  //   return combined.includes(debouncedSearch.toLowerCase());
  // });



  // useEffect(() => {
  //   fetchAssignment();
  // }, []);

  useEffect(() => {
    if (assignment?.internId) {
      socket.emit('join', `user-${assignment.internId}`);
    }
  }, [assignment]);

  // Xem chi tiết mô tả 
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [descContent, setDescContent] = useState('');



  // useEffect(() => {
  //   api.get('/interns/assignment').then((res) => {
  //     setAssignment(res.data);
  //     if (res.data?.internId) {
  //       socket.emit('join', `user-${res.data.internId}`);
  //     }
  //   });
  // }, []);


  useEffect(() => {
    socket.on('task_assigned', (task) => {
      setTasks(prev => [task, ...prev]);
      setNotification(`Bạn vừa được giao task: ${task.title}`);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('task_assigned');
    };
  }, []);

  const handleAccept = async (id: number) => {
    await api.patch(`/interns/tasks/${id}/accept`);
    const updated = tasks.map(t => t.id === id ? { ...t, status: 'in_progress' } : t);
    setTasks(updated);
  };

  // const filteredTasks = tasks.filter(task =>
  //   `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())
  // );

  return (
    <div className="w-full p-4">
      <div className="mb-4 w-full">
        <h1 className="text-2xl flex items-center gap-2 w-full font-medium text-[#243874]">
          Thông tin thực tập
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6 w-full">
        {assignment ? (
          <>
            <p className="font-semibold">Mentor: {assignment.mentor?.name}</p>
            <p>Từ ngày: {assignment.startDate}</p>
            <p>Đến ngày: {assignment.endDate}</p>
          </>
        ) : (
          <p className="text-gray-500">Chưa có phân công thực tập</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 w-full">
       
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
          placeholder="Tìm kiếm theo tên, mô tả, mentor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />


      </div>

      <div className="w-full overflow-x-auto">
        {tasks.length === 0 ? (
          <p className="text-gray-500">Không có task phù hợp.</p>
        ) : (
          <table className="w-full bg-white border rounded shadow">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Tiêu đề</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3">Hạn</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="p-3 font-medium">{task.title}</td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setDescContent(task.description);
                        setDescDialogOpen(true);
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{task.dueDate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${task.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {task.status === 'assigned'
                        ? 'Chưa nhận'
                        : task.status === 'in_progress'
                          ? 'Đang làm'
                          : 'Hoàn thành'}
                    </span>
                  </td>
                  <td className="p-3">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => handleAccept(task.id)}
                        className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 w-full sm:w-auto"
                      >
                        Chấp nhận
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {notification && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}
      <DescriptionViewerDialog
        open={descDialogOpen}
        onClose={() => setDescDialogOpen(false)}
        description={descContent}
      />
    </div>
  );


}
