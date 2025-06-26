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


  // xu ly nop bai 
  const [showSubmitModal, setShowSubmitModal] = useState(false);
const [submitText, setSubmitText] = useState('');
const [submitFile, setSubmitFile] = useState<File | null>(null);
const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);




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



  const [logOpen, setLogOpen] = useState(false);
interface TaskLog {
  createdAt: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
  message?: string;
  fileUrl?: string;
}


const [submitNote, setSubmitNote] = useState('');

const [logs, setLogs] = useState<TaskLog[]>([]);
const [loadingLogs, setLoadingLogs] = useState(false);

const handleViewLogs = async (taskId: number) => {
  setLoadingLogs(true);
  try {
    const res = await api.get(`/task-logs/${taskId}`);
    setLogs(res.data.data);
    setLogOpen(true);
  } catch (err) {
    alert('Lỗi khi tải log');
  } finally {
    setLoadingLogs(false);
  }
};

// gui file 
const handleSubmit = async () => {
  if (!submitTaskId) return;

  const formData = new FormData();
  formData.append('submittedText', submitText);
  formData.append('note', submitNote); 
  if (submitFile) formData.append('file', submitFile);

  try {
    await api.patch(`/interns/tasks/${submitTaskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const updated = tasks.map(t =>
      t.id === submitTaskId ? { ...t, status: 'completed' } : t
    );
    setTasks(updated);
    setShowSubmitModal(false);
    setSubmitText('');
    setSubmitNote(''); // reset note
    setSubmitFile(null);
  } catch (err) {
    console.error('Lỗi khi nộp bài:', err);
  }
};



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
          className={`px-2 py-1 text-xs rounded-full font-semibold ${
            task.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : task.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : task.status === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {task.status === 'assigned'
            ? 'Chưa nhận'
            : task.status === 'in_progress'
            ? 'Đang làm'
            : task.status === 'completed'
            ? 'Hoàn thành'
            : 'Lỗi'}
        </span>
      </td>

      {/* Gộp toàn bộ hành động vào 1 cột */}
      <td className="p-3 space-y-1">
        {task.status === 'assigned' && (
          <button
            onClick={() => handleAccept(task.id)}
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 block"
          >
            Chấp nhận
          </button>
        )}

        {(task.status === 'in_progress' || task.status === 'error') && (
          <button
            onClick={() => {
              setSubmitTaskId(task.id);
              setShowSubmitModal(true);
            }}
            className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 block"
          >
            Nộp bài
          </button>
        )}

        {task.status === 'error' && (
          <p className="text-sm text-red-500 italic">Yêu cầu làm lại</p>
        )}
      </td>
      <button
  onClick={() => handleViewLogs(task.id)}
  className="text-sm text-blue-600 hover:underline"
>
  Xem lịch sử
</button>
    </tr>
  ))}
</tbody>

          </table>
        )}
      </div>
{showSubmitModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white p-6 rounded w-full max-w-md">
      <h2 className="text-lg font-bold mb-2">Nộp bài</h2>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={4}
        placeholder="Nhập mô tả bài làm..."
        value={submitText}
        onChange={(e) => setSubmitText(e.target.value)}
      />
      <input
        type="file"
        onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <textarea
  className="w-full border rounded p-2 mb-2"
  rows={3}
  placeholder="Ghi chú thêm (nếu có)..."
  value={submitNote}
  onChange={(e) => setSubmitNote(e.target.value)}
/>

      <div className="flex justify-end gap-2">
        <button onClick={() => setShowSubmitModal(false)}>Huỷ</button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          Nộp
        </button>
      </div>
    </div>
  </div>
)}
{logOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Lịch sử cập nhật task</h2>
        <button onClick={() => setLogOpen(false)} className="text-sm text-gray-500 hover:underline">Đóng</button>
      </div>

      {loadingLogs ? (
        <p>Đang tải...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 italic">Chưa có log</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {logs.map((log, idx) => (
            <li key={idx} className="border p-3 rounded">
              <p><strong>Thời gian:</strong> {new Date(log.createdAt).toLocaleString()}</p>
              <p><strong>Trạng thái:</strong> {log.fromStatus} → {log.toStatus}</p>
              {log.note && <p><strong>Ghi chú:</strong> {log.note}</p>}
              {log.message && <p className="text-gray-600 italic">{log.message}</p>}
              {/* {log.fileUrl && (
                <a href={`/uploads/tasks/${log.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Xem file</a>
              )} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)}

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
