import { useEffect, useRef, useState } from 'react';
import api from '../../utils/axios';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { confirmAlert } from 'react-confirm-alert';
import { useSearchParams } from 'react-router-dom';
import RichTextEditor, { RichTextEditorRef } from '../../components/RichTextEditer';
import DescriptionViewerDialog from '../../components/DesciptionTask';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from '../../components/Toast';
import { useDebounce } from 'use-debounce';
import mammoth from "mammoth";
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {useClickOutside} from '../../hooks/useCloseModal';



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
  const BACKEND_URL = "http://localhost:3000";




  const [statusNote, setStatusNote] = useState('');

  // const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  // xem bao cao 
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportFile, setReportFile] = useState('');

  // thong bao toast 
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // log 
  const [logHistory, setLogHistory] = useState([]);
  const [logDialogOpen, setLogDialogOpen] = useState(false);


  const handleShowLog = async (taskId: number) => {
    try {
      const res = await api.get(`/task-logs/${taskId}`);
      setLogHistory(res.data.data);
      setLogDialogOpen(true);
    } catch (err) {
      showToastMessage('Không thể tải log');
    }
  };

  // ham show toast
  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // tự ẩn sau 3s
  };

  const [docxPreviewContent, setDocxPreviewContent] = useState('');
  const [docxDialogOpen, setDocxDialogOpen] = useState(false);

  //paging 
  const [page, setPage] = useState(1);
  const limit = 10; // số task trên mỗi trang
  const { data: interns = [] } = useQuery({
    queryKey: ['mentorInterns', debouncedSearch],
    queryFn: () =>
      api
        .get('/mentor/interns', {
          params: { search: debouncedSearch },
        })
        .then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });



const modalRef = useRef<HTMLDivElement>(null);
useClickOutside(modalRef, () => setOpenDialog(false));

const taskDialogRef = useRef<HTMLDivElement>(null);
useClickOutside(taskDialogRef, () => setOpenDialog(false));




  const {
  data: taskPages,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['mentorTasks', debouncedTaskSearch],
  queryFn: ({ pageParam = 1 }) =>
    api
      .get('mentor/tasks', {
        params: { title: debouncedTaskSearch, page: pageParam, limit: 10 },
      })
      .then((res) => res.data),
      initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    const totalPages = Math.ceil(lastPage.total / 10);
    const nextPage = allPages.length + 1;
    return nextPage <= totalPages ? nextPage : undefined;
  },
  enabled: tab === 'tasks',
  staleTime: 5 * 60 * 1000, 
});
const tasks = taskPages?.pages.flatMap(p => p.data) || [];
const parentTaskRef = useRef<HTMLDivElement>(null);
const taskVirtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentTaskRef.current,
  estimateSize: () => 60,
  overscan: 5,
});
// useEffect(() => {
//   const items = taskVirtualizer.getVirtualItems();
//   if (
//     hasNextPage &&
//     !isFetchingNextPage &&
//     items.length > 0 &&
//     items[items.length - 1].index >= tasks.length - 1
//   ) {
//     fetchNextPage();
//   }
// }, [taskVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, tasks.length]);

  // const handlePreviewDocx = async (fileUrl: string) => {
  //   try {
  //     const response = await fetch(fileUrl);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const arrayBuffer = await response.arrayBuffer();
  //     const result = await mammoth.convertToHtml({ arrayBuffer });

  //     if (!result.value) {
  //       throw new Error("Không thể chuyển đổi nội dung Word.");
  //     }
  //     const res = await fetch(fileUrl);
  //     const contentType = res.headers.get("Content-Type");
  //     console.log("Content-Type:", contentType);

  //     const text = await res.text();
  //     console.log("TEXT:", text.slice(0, 300));
  //     setDocxPreviewContent(result.value);
  //     setDocxDialogOpen(true);
  //   } catch (error: any) {
  //     console.error("Lỗi đọc file Word:", error);
  //     showToastMessage("Không thể xem file Word.");
  //   }
  // };

useEffect(() => {
  const scrollEl = parentTaskRef.current;
  if (!scrollEl) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;

    const reachedBottom = scrollTop + clientHeight >= scrollHeight - 50; // gần cuối 50px
    if (reachedBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  scrollEl.addEventListener('scroll', handleScroll);
  return () => scrollEl.removeEventListener('scroll', handleScroll);
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);



  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'interns' || currentTab === 'tasks') {
      setTab(currentTab);
    }
  }, [searchParams]);

  useEffect(() => {
  if (mode === 'reuse') {
    api
      .get('/mentor/tasks', {
        params: {
          unassignedOnly: true, 
          title: reuseSearch   
        }
      })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setMyTasks(data);
      })
      .catch(err => {
        console.error("Failed to fetch reuse tasks:", err);
        setMyTasks([]);
      });
  }
}, [mode, reuseSearch]);



  const handleCreateTask = async () => {
    if (!titleRef.current || !dateRef.current || !descEditorRef.current) return;
    const title = titleRef.current.value.trim();
    const dueDate = dateRef.current.value;
    const description = descEditorRef.current.getHTML();

    if (!title || !dueDate) {
      showToastMessage('Please fill title and due date!');
      return;
    }
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);

    if (dueDateObj < today) {
      showToastMessage('Due date must be today or later!');
      return;
    }

    try {
      await api.post('/mentor/tasks', {
        title,
        dueDate,
        description,
        assignedTo: selectedIntern?.id || null,
      });
      showToastMessage('Create task successfully!');
      setOpenDialog(false);
      titleRef.current.value = '';
      dateRef.current.value = '';
      descEditorRef.current.setHTML('');
      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
      if (selectedIntern) fetchTasksForIntern(selectedIntern.id);
    } catch (err) {
      console.error('Lỗi tạo task:', err);
      showToastMessage('Faild create task!');
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
              showToastMessage('Delete task successfully!');
            } catch {
              showToastMessage('Delete task failed!');
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

  // const filteredInterns = interns.filter((i: any) =>
  //   `${i.name} ${i.email}`.toLowerCase().includes(search.toLowerCase())
  // );
  const filteredInterns = interns;
  const filteredTasks = tasks.filter((t: any) =>
    `${t.title} ${t.assignedTo?.name || ''}`.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const filteredMyTasks = Array.isArray(myTasks)
  ? myTasks.filter(
      (task) =>
        (!task.assignedTo || !task.assignedTo.id) && 
        `${task.title} ${task.description || ''}`.toLowerCase().includes(reuseSearch.toLowerCase())
    )
  : [];

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

          <div ref={parentTaskRef} className="overflow-auto h-[600px] border rounded">
  <div className="grid grid-cols-6 bg-gray-100 text-xs font-medium text-gray-700 sticky top-0 z-10">
    <div className="p-2">Tiêu đề</div>
    <div className="p-2">Mô tả</div>
    <div className="p-2">Người nhận</div>
    <div className="p-2">Hạn</div>
    <div className="p-2">Trạng thái</div>
    <div className="p-2">Hành động</div>
  </div>

  <div style={{ height: `${taskVirtualizer.getTotalSize()}px`, position: 'relative' }}>
    {taskVirtualizer.getVirtualItems().map((virtualRow) => {
      const task = tasks[virtualRow.index];
      return (
        <div
          key={task.id}
          className="grid grid-cols-6 text-sm items-center border-b bg-white hover:bg-gray-50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
            height: `${virtualRow.size}px`,
          }}
        >
          <div className="p-2 font-medium">{task.title}</div>
          <div className="p-2">
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={() => {
                setDescContent(task.description);
                setDescDialogOpen(true);
              }}
            >
              Xem chi tiết
            </button>
          </div>
          <div className="p-2">{task.assignedTo?.name || task.assignedTo?.email || 'Chưa giao'}</div>
          <div className="p-2">{task.dueDate}</div>
          <div className="p-2 capitalize">{task.status}</div>
          <div className="p-2">
            <button
              className="text-red-600 hover:underline text-sm"
              onClick={() => handleDeleteTask(task.id)}
            >
              Xoá
            </button>
          </div>
        </div>
      );
    })}
  </div>
</div>

{isFetchingNextPage && (
  <div className="text-center text-blue-600 py-2">Đang tải thêm...</div>
)}
{/* {!hasNextPage && (
  <div className="text-center text-gray-500 py-2 italic">Đã tải toàn bộ task.</div>
)} */}

        </>
      )}
      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      {/* Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white p-6 rounded-md w-full max-w-xl shadow-lg">

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
                                showToastMessage("Task assigned successfully!");
                                setMyTasks((prev) => prev.filter((t) => t.id !== task.id));
                                if (tab === 'tasks') {
                                  const updated = await api.get('/mentor/tasks');
                                  setMyTasks(updated.data);
                                }
                                setOpenDialog(false);
                                fetchTasksForIntern(selectedIntern.id);
                              } catch {
                                showToastMessage("Task assigned successfully!");
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
          <div ref={modalRef}  className="bg-white p-6 rounded-md w-full max-w-3xl shadow-lg overflow-y-auto max-h-[90vh]">

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
                          <th className="border border-gray-300 p-2">Báo cáo</th>

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
                            <td className="border border-gray-300 p-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-semibold ${task.status === 'completed'
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

                            <td className="border border-gray-300 p-2 space-x-2">
                              {task.status === 'in_progress' && (task.submittedText || task.submittedFile) && (
                                <button
                                  className="text-orange-600 hover:underline text-sm"
                                  onClick={async () => {
                                    const note = prompt('Nhập lý do đánh lỗi (tuỳ chọn):') || ''; 
                                    try {
                                      await api.patch(`/mentor/tasks/${task.id}/status`, {
                                        status: 'error',
                                        note,
                                      });
                                      showToastMessage('Đánh lỗi thành công. Task sẽ tự động reset sau 2s...');

                                      setTimeout(async () => {
                                        try {
                                          await api.patch(`/mentor/tasks/${task.id}/status`, {
                                            status: 'assigned',
                                            note: 'Reset sau khi đánh lỗi', // 
                                          });
                                          fetchTasksForIntern(taskModalIntern.id);
                                          queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                                          showToastMessage('Task đã được reset lại thành công');
                                        } catch {
                                          showToastMessage('Reset task thất bại');
                                        }
                                      }, 2000);
                                    } catch {
                                      showToastMessage('Lỗi khi đánh lỗi task');
                                    }
                                  }}

                                >
                                  Đánh lỗi (tự reset)
                                </button>
                              )}


                              {(task.status === 'completed' || task.status === 'error') && (
                                <button
                                  className="text-blue-600 hover:underline text-sm"
                                  onClick={async () => {
                                    const note = prompt('Nhập lý do reset task (tuỳ chọn):') || '';
                                    try {
                                      await api.patch(`/mentor/tasks/${task.id}/status`, {
                                        status: 'assigned',
                                        note,
                                      });
                                      fetchTasksForIntern(taskModalIntern.id);
                                      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                                      showToastMessage('Reset task thành công');
                                    } catch {
                                      showToastMessage('Lỗi khi reset task');
                                    }
                                  }}

                                >
                                  Reset task
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
                                    showToastMessage("Delete task failed!");
                                  }
                                }}
                              >
                                Xoá
                              </button>
                            </td>
                            <td className="border border-gray-300 p-2">
                              {(task.submittedText || task.submittedFile) ? (
                                <button
                                  className="text-blue-600 hover:underline text-sm"
                                  onClick={() => {
                                    setReportContent(task.submittedText || '');
                                    setReportFile(task.submittedFile || '');
                                    setReportDialogOpen(true);
                                  }}
                                >
                                  Xem báo cáo
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Chưa nộp</span>
                              )}
                            </td>
                            <button
                              onClick={() => handleShowLog(task.id)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Xem lịch sử
                            </button>


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
      {reportDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Báo cáo của Intern</h3>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setReportDialogOpen(false)}
              >
                Đóng
              </button>
            </div>

            {reportContent && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Nội dung:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap border">
                  {reportContent}
                </div>
              </div>
            )}

            {reportFile && (
              <div>
                <h4 className="font-medium mb-1">File đính kèm:</h4>
                <a
                  href={`http://localhost:3000/uploads/tasks/${reportFile}`}
                  download
                  className="text-blue-600 hover:underline text-sm"
                >
                  Tải file Word
                </a>



              </div>
            )}

            {!reportContent && !reportFile && (
              <p className="italic text-gray-500">Không có nội dung báo cáo.</p>
            )}
          </div>
        </div>
      )}
      {docxDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-3xl shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Xem nội dung file Word</h3>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setDocxDialogOpen(false)}
              >
                Đóng
              </button>
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: docxPreviewContent }}
            />
          </div>
        </div>
      )}
      {logDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lịch sử cập nhật trạng thái</h3>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setLogDialogOpen(false)}
              >
                Đóng
              </button>
            </div>

            {logHistory.length === 0 ? (
              <p className="text-gray-500 italic">Chưa có lịch sử nào.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {logHistory.map((log: any, idx) => (
                  <li key={idx} className="border p-3 rounded">
                    <p><strong>Người cập nhật:</strong> {log.user?.name || 'Ẩn danh'}</p>
                    <p><strong>Thời gian:</strong> {new Date(log.createdAt).toLocaleString()}</p>
                    {/* <p><strong>Trạng thái:</strong> từ <em>{log.fromStatus}</em> → <em>{log.toStatus}</em></p> */}
                    {log.note && (
                      <p><strong>Lý do:</strong> {log.note}</p>
                    )}
                    {log.message && (
                      <p className="text-gray-600 italic">{log.message}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
