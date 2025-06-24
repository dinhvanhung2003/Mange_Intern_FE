import { useEffect, useRef, useState } from 'react';
import api from '../../utils/axios';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { confirmAlert } from 'react-confirm-alert';
import { useSearchParams } from 'react-router-dom';
import RichTextEditor, { RichTextEditorRef } from '../../components/RichTextEditer';
import DescriptionViewerDialog from '../../components/DesciptionTask';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
export default function MentorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'interns' | 'tasks') || 'interns';
  const [tab, setTab] = useState<'interns' | 'tasks'>(initialTab);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [tasksByIntern, setTasksByIntern] = useState<Record<number, any[]>>({});
  const [taskModalIntern, setTaskModalIntern] = useState<any | null>(null);
  const descEditorRef = useRef<RichTextEditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [mode, setMode] = useState<'new' | 'reuse'>('new');
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [reuseSearch, setReuseSearch] = useState('');
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [descContent, setDescContent] = useState('');
  const [internTaskSearch, setInternTaskSearch] = useState('');
  const queryClient = useQueryClient();
  const [debouncedTaskSearch] = useDebounce(taskSearch, 300);
  const { data: interns = [] } = useQuery({
    queryKey: ['mentorInterns'],
    queryFn: () => api.get('/mentor/interns').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['mentorTasks', debouncedTaskSearch],
    queryFn: () =>
      api.get('mentor/tasks', { params: { title: debouncedTaskSearch } }).then(res => res.data),

    enabled: tab === 'tasks',
    staleTime: 5 * 60 * 1000,
  });


  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'interns' || currentTab === 'tasks') {
      setTab(currentTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode === 'reuse') {
      api.get('/mentor/tasks').then(res => setMyTasks(res.data));
    }
  }, [mode]);

  const handleCreateTask = async () => {
    if (!titleRef.current || !dateRef.current || !descEditorRef.current) return;
    const title = titleRef.current.value.trim();
    const dueDate = dateRef.current.value;
    const description = descEditorRef.current.getHTML();

    if (!title || !dueDate) {
      alert('Vui lòng nhập tiêu đề và hạn hoàn thành!');
      return;
    }
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);

    if (dueDateObj < today) {
      alert('Ngày hạn không được nhỏ hơn ngày hôm nay!');
      return;
    }

    try {
      await api.post('/mentor/tasks', {
        title,
        dueDate,
        description,
        assignedTo: selectedIntern?.id || null,
      });
      alert('Đã tạo task thành công!');
      setOpenDialog(false);
      titleRef.current.value = '';
      dateRef.current.value = '';
      descEditorRef.current.setHTML('');
      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
      if (selectedIntern) fetchTasksForIntern(selectedIntern.id);
    } catch (err) {
      console.error('Lỗi tạo task:', err);
      alert('Tạo task thất bại!');
    }
  };

  const handleDeleteTask = (taskId: number) => {
    confirmAlert({
      title: 'Xác nhận xoá task',
      message: 'Bạn có chắc chắn muốn xoá task này không?',
      buttons: [
        {
          label: 'Xoá',
          onClick: async () => {
            try {
              await api.delete(`/mentor/tasks/${taskId}`);
              queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
              if (taskModalIntern) fetchTasksForIntern(taskModalIntern.id);
            } catch {
              alert('Xoá task thất bại!');
            }
          },
        },
        { label: 'Huỷ', onClick: () => { } },
      ],
    });
  };

  const fetchTasksForIntern = async (internId: number) => {
    try {
      const res = await api.get(`/mentor/interns/${internId}/tasks`);
      setTasksByIntern(prev => ({ ...prev, [internId]: res.data }));
    } catch (err) {
      console.error('Lỗi tải task:', err);
    }
  };

  const filteredInterns = interns.filter((i: any) =>
    `${i.name} ${i.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = tasks.filter((t: any) =>
    `${t.title} ${t.assignedTo?.name || ''}`.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const filteredMyTasks = myTasks.filter(
    (task) =>
      !task.assignedTo?.id &&
      `${task.title} ${task.description}`.toLowerCase().includes(reuseSearch.toLowerCase())
  );
  return (
    <div className="p-6">
      {/* Tabs */}
      {/* <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${tab === 'interns' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setTab('interns');
            setSearchParams({ tab: 'interns' });
          }}
        >
          Quản lý Intern
        </button>

        <button
          className={`px-4 py-2 rounded ${tab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setTab('tasks');
            setSearchParams({ tab: 'tasks' });
          }}
        >
          Quản lý Task
        </button>

      </div> */}

      {/* Interns View */}
      {tab === 'interns' && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-[#243874]">Danh sách Intern</h2>
          <input
            type="text"
            placeholder="Tìm kiếm intern"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 border rounded px-3 py-2 w-full sm:w-64 outline-none"
          />
          <div className="space-y-4">

            <table className="min-w-full border border-gray-200 divide-y divide-gray-200 shadow-sm rounded-md overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase text-left">
                <tr>
                  <th className="px-4 py-2">Tên</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Trường</th>
                  <th className="px-4 py-2">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800 bg-white">
                {filteredInterns.map((intern: any) => (
                  <tr key={intern.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{intern.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{intern.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{intern.school || 'Chưa có trường'}</td>
                    <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                      <button
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium"
                        onClick={() => {
                          setSelectedIntern(intern);
                          setOpenDialog(true);
                          setMode('new');
                        }}
                      >
                        Giao Task
                      </button>
                      <button
                        className="text-gray-700 border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded text-xs font-medium"
                        onClick={() => {
                          setTaskModalIntern(intern);
                          fetchTasksForIntern(intern.id);
                        }}
                      >
                        Xem task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>




          </div>
        </>
      )}

      {/* Tasks View */}
      {tab === 'tasks' && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-[#243874]">Quản lý Task </h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setSelectedIntern(null);
              setOpenDialog(true);
              setMode('new');
            }}
          >
            + Tạo Task
          </button>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc intern"
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            className="mb-4 border rounded px-3 py-2 w-full sm:w-64 outline-none"
          />

          <table className="min-w-full border border-gray-200 divide-y divide-gray-200 shadow-sm rounded-md overflow-hidden mt-4">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase text-left">
              <tr>
                <th className="px-4 py-2">Tiêu đề</th>
                <th className="px-4 py-2">Mô tả</th>
                <th className="px-4 py-2">Người nhận</th>
                <th className="px-4 py-2">Hạn</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800 bg-white">
              {tasks.map((task: any) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{task.title}</td>
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
                  <td className="px-4 py-2 whitespace-nowrap">
                    {task.assignedTo?.name || task.assignedTo?.email || 'Chưa giao'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{task.dueDate}</td>
                  <td className="px-4 py-2 capitalize whitespace-nowrap">{task.status}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


        </>
      )}

      {/* Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-xl shadow-lg">

            <h3 className="text-lg font-semibold mb-4">
              {selectedIntern ? `Giao task cho ${selectedIntern.name}` : 'Tạo task mới'}
            </h3>
            <div className="space-y-3">
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-3 py-1 rounded ${mode === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setMode('new')}
                >
                  Task mới
                </button>
                {selectedIntern && (
                  <button
                    className={`px-3 py-1 rounded ${mode === 'reuse' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setMode('reuse')}
                  >
                    Chọn task có sẵn
                  </button>
                )}
              </div>

              {mode === 'new' ? (
                <>
                  <input
                    type="text"
                    placeholder="Tiêu đề"
                    ref={titleRef}
                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none"
                  />
                  <input
                    type="date"
                    ref={dateRef}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <div className="mt-4">
                    <RichTextEditor ref={descEditorRef} />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setOpenDialog(false)}>
                      Huỷ
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreateTask}>
                      Tạo Task
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Tìm kiếm task theo tiêu đề, mô tả..."
                    value={reuseSearch}
                    onChange={(e) => setReuseSearch(e.target.value)}
                    className="w-full border px-3 py-2 rounded mb-2"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredMyTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Không tìm thấy task phù hợp.</p>
                    ) : (
                      filteredMyTasks.map((task) => (
                        <div key={task.id} className="border p-2 rounded flex justify-between items-start">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">Hạn: {task.dueDate}</p>
                          </div>
                          <button
                            className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
                            onClick={async () => {
                              try {
                                await api.patch(`/mentor/tasks/${task.id}/assign`, {
                                  internId: selectedIntern.id,
                                });
                                queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                                alert('Đã giao task!');
                                setMyTasks((prev) => prev.filter((t) => t.id !== task.id));
                                if (tab === 'tasks') {
                                  const updated = await api.get('/mentor/tasks');
                                  setMyTasks(updated.data);
                                }
                                setOpenDialog(false);
                                fetchTasksForIntern(selectedIntern.id);
                              } catch {
                                alert('Lỗi khi giao task!');
                              }
                            }}

                          >
                            Giao task
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {taskModalIntern && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-3xl shadow-lg overflow-y-auto max-h-[90vh]">

            {(() => {
              const internTasks = tasksByIntern[taskModalIntern.id] || [];
              var filteredInternTasks = internTasks.filter(task =>
                `${task.title} ${task.description} ${task.status}`
                  .toLowerCase()
                  .includes(internTaskSearch.toLowerCase())
              );
              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Task của Intern: {taskModalIntern.name}
                    </h3>
                    <button
                      className="text-sm text-gray-500 hover:underline"
                      onClick={() => setTaskModalIntern(null)}
                    >
                      Đóng
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Tìm task theo tiêu đề, mô tả, trạng thái..."
                    value={internTaskSearch}
                    onChange={(e) => setInternTaskSearch(e.target.value)}
                    className="mb-4 border border-gray-300 rounded px-3 py-2 w-full outline-none"
                  />

                  {/* Hiển thị bảng task */}
                  {filteredInternTasks.length > 0 ? (
                    <table className="w-full table-auto border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 p-2">Tiêu đề</th>
                          <th className="border border-gray-300 p-2">Mô tả</th>
                          <th className="border border-gray-300 p-2">Hạn</th>
                          <th className="border border-gray-300 p-2">Trạng thái</th>
                          <th className="border border-gray-300 p-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInternTasks.map((task) => (
                          <tr key={task.id}>
                            <td className="border border-gray-300 p-2">{task.title}</td>
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
                            <td className="border border-gray-300 p-2">{task.dueDate}</td>
                            <td className="border border-gray-300 p-2 capitalize">{task.status}</td>
                            <td className="border border-gray-300 p-2 space-x-2">
                              {task.status === 'in_progress' && (
                                <button
                                  className="text-blue-600 hover:underline text-sm"
                                  onClick={async () => {
                                    try {
                                      await api.patch(`/mentor/tasks/${task.id}/complete`);
                                      fetchTasksForIntern(taskModalIntern.id);
                                      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                                    } catch {
                                      alert('Lỗi khi hoàn thành task!');
                                    }
                                  }}
                                >
                                  Hoàn thành
                                </button>
                              )}
                              <button
                                className="text-red-600 hover:underline text-sm"
                                onClick={async () => {
                                  const confirm = window.confirm('Bạn có chắc muốn xoá task này?');
                                  if (!confirm) return;

                                  try {
                                    await api.delete(`/mentor/tasks/${task.id}`);
                                    fetchTasksForIntern(taskModalIntern.id);
                                  } catch {
                                    alert('Lỗi khi xoá task!');
                                  }
                                }}
                              >
                                Xoá
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Không tìm thấy task phù hợp.</p>
                  )}
                </>
              );
            })()}
          </div>
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
