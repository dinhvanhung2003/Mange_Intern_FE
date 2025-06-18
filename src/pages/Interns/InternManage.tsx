import { useEffect, useRef, useState } from 'react';
import api from '../../utils/axios';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { confirmAlert } from 'react-confirm-alert';

import RichTextEditor, { RichTextEditorRef } from '../../components/RichTextEditer';

export default function MentorDashboard() {
  const [tab, setTab] = useState<'interns' | 'tasks'>('interns');
  const [interns, setInterns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [expandedIntern, setExpandedIntern] = useState<number | null>(null);
  const [tasksByIntern, setTasksByIntern] = useState<Record<number, any[]>>({});

  const descEditorRef = useRef<RichTextEditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [mode, setMode] = useState<'new' | 'reuse'>('new');
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [reuseSearch, setReuseSearch] = useState('');

  const filteredMyTasks = myTasks.filter((task) =>
    `${task.title} ${task.description}`.toLowerCase().includes(reuseSearch.toLowerCase())
  );

  useEffect(() => {
    if (mode === 'reuse') {
      api.get('/mentor/tasks').then(res => setMyTasks(res.data));
    }
  }, [mode]);

  useEffect(() => {
    api.get('/mentor/interns')
      .then((res) => setInterns(res.data))
      .catch((err) => console.error('Lỗi tải interns:', err));
  }, []);

  useEffect(() => {
    if (tab === 'tasks') {
      api.get('/mentor/tasks')
        .then((res) => setTasks(res.data))
        .catch((err) => console.error('Lỗi tải tasks:', err));
    }
  }, [tab]);

  const fetchTasksForIntern = async (internId: number) => {
    try {
      const res = await api.get(`/mentor/interns/${internId}/tasks`);
      setTasksByIntern((prev) => ({ ...prev, [internId]: res.data }));
    } catch (err) {
      console.error('Lỗi tải task:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!titleRef.current || !dateRef.current || !descEditorRef.current) return;

    const title = titleRef.current.value.trim();
    const dueDate = dateRef.current.value;
    const description = descEditorRef.current.getHTML();

    if (!title || !dueDate) {
      alert('Vui lòng nhập tiêu đề và hạn hoàn thành!');
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

      if (tab === 'tasks') {
        const res = await api.get('/mentor/tasks');
        setTasks(res.data);
      }
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
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
            } catch {
              alert('Xoá task thất bại!');
            }
          },
        },
        { label: 'Huỷ', onClick: () => {} },
      ],
    });
  };

  const filteredInterns = interns.filter((i) =>
    `${i.name} ${i.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    `${t.title} ${t.assignedTo?.name || ''}`.toLowerCase().includes(taskSearch.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${tab === 'interns' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('interns')}
        >
          Quản lý Intern
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('tasks')}
        >
          Quản lý Task
        </button>
      </div>

      {/* Interns View */}
      {tab === 'interns' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Danh sách Intern</h2>
          <input
            type="text"
            placeholder="Tìm kiếm intern"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 border rounded px-3 py-2 w-full sm:w-64"
          />
          <div className="space-y-4">
            {filteredInterns.map((intern) => (
              <div key={intern.id} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{intern.name}</h3>
                    <p className="text-sm text-gray-600">{intern.email}</p>
                    <p className="text-sm text-gray-600">{intern.school || 'Chưa có trường'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                      onClick={() => {
                        setSelectedIntern(intern);
                        setOpenDialog(true);
                        setMode('new');
                      }}
                    >
                      Giao Task
                    </button>
                    <button
                      className="border border-gray-300 px-3 py-1 rounded"
                      onClick={() => {
                        const shouldExpand = expandedIntern !== intern.id;
                        setExpandedIntern(shouldExpand ? intern.id : null);
                        if (shouldExpand && !tasksByIntern[intern.id]) {
                          fetchTasksForIntern(intern.id);
                        }
                      }}
                    >
                      {expandedIntern === intern.id ? 'Ẩn task' : 'Xem task'}
                    </button>
                  </div>
                </div>
                {expandedIntern === intern.id && (
                  <div className="mt-4 pl-4 border-l border-gray-200">
                    {(tasksByIntern[intern.id] || []).map((task) => (
                      <div key={task.id} className="mb-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">
                              Hạn: {task.dueDate} | Trạng thái: {task.status}
                            </p>
                          </div>
                          {task.status === 'in_progress' && (
                            <button
                              className="text-green-600 hover:underline text-sm"
                              onClick={async () => {
                                try {
                                  await api.patch(`/mentor/tasks/${task.id}/complete`);
                                  fetchTasksForIntern(intern.id);
                                } catch {
                                  alert('Lỗi khi hoàn thành task!');
                                }
                              }}
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                        <hr className="my-2" />
                      </div>
                    ))}
                    {tasksByIntern[intern.id]?.length === 0 && (
                      <p className="text-sm text-gray-500 italic">Chưa có task nào.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tasks View */}
      {tab === 'tasks' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Quản lý Task đã tạo</h2>
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
            className="mb-4 border rounded px-3 py-2 w-full sm:w-64"
          />

          {filteredTasks.map((task) => (
            <div key={task.id} className="border p-4 rounded mb-2">
              <h3 className="font-semibold">{task.title}</h3>
              <div className="prose max-w-none [&_img]:max-w-[500px] [&_img]:w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mx-auto">
                <div dangerouslySetInnerHTML={{ __html: task.description }} />
              </div>
              <p className="text-sm text-gray-500">
                Người nhận: {task.assignedTo?.name || task.assignedTo?.email} | Hạn: {task.dueDate} | Trạng thái: {task.status}
              </p>
              <div className="mt-2 flex gap-2">
                <button className="text-red-600 text-sm" onClick={() => handleDeleteTask(task.id)}>
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md shadow-lg">
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
                    className="w-full border border-gray-300 rounded px-3 py-2"
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
                                await api.post(`/mentor/tasks/reuse`, {
                                  taskId: task.id,
                                  internId: selectedIntern.id,
                                });
                                alert('Đã giao lại task!');
                                setOpenDialog(false);
                                fetchTasksForIntern(selectedIntern.id);
                              } catch {
                                alert('Lỗi khi giao lại task!');
                              }
                            }}
                          >
                            Giao lại
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
    </div>
  );
}
