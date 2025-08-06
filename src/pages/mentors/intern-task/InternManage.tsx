import { useEffect, useRef, useState } from 'react';
import api from '../../../utils/axios';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { confirmAlert } from 'react-confirm-alert';
import { useSearchParams } from 'react-router-dom';
import RichTextEditor, { RichTextEditorRef } from '../../../components/RichTextEditer';
import DescriptionViewerDialog from '../../../components/DesciptionTask';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from '../../../components/Toast';
import { useDebounce } from 'use-debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import InternTopicManager from '../topic/InternTopicManager';
import DocumentViewerDialog, { Document } from '../../../components/Document/DocumentViewer';
import DocumentSelectorDialog from "../../../components/Document/ChooseDocument";
import { Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography } from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import {
  Chip,
} from "@mui/material";
import AssignInternDialog from './AssignInternDialog';
import { Link } from 'react-router-dom';
import MuiLink from '@mui/material/Link';
import { useOutletContext } from 'react-router-dom';
import {exportScoreReport} from '../../../hooks/ExportGradeTask';
import { exportScoreReportExcel } from '../../../hooks/ExportGradeTaskExcel';
interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'error';
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  submittedText?: string;
  submittedFile?: string;
  score?: number | null;
  sharedDocuments?: Document[];
  createdAt?: string;
  updatedAt?: string;
  logs?: {
    id: number;
    action: string;
    createdAt: string;
  }[];
}

type ContextType = { showSnackbar: (message: string, severity?: "success" | "error" | "info" | "warning") => void };





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

  const { showSnackbar } = useOutletContext<ContextType>();


  // topic 
  const [topicModalIntern, setTopicModalIntern] = useState<any | null>(null);


  // chọn tài liệu khi tạo task 
  // const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);


  // xem tài liệu cho task 
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);

  // const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  // Xem báo cáo của Intern 
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportFile, setReportFile] = useState('');

  // thong bao toast 
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // log 
  const [logHistory, setLogHistory] = useState([]);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // thong tin cho prompt 
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteActionType, setNoteActionType] = useState<'error' | 'reset' | null>(null);
  const [noteTargetTask, setNoteTargetTask] = useState<any>(null);
  const [noteInput, setNoteInput] = useState('');


  // giao task ở phía quản lý task 
  const [openAssignDialog, setOpenAssignDialog] = useState(false);


  const [gradeTask, setGradeTask] = useState<Task | null>(null);

  const [gradeScore, setGradeScore] = useState(0);


  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // hàm chấm điểm task
  const handleGradeTask = async (taskId: number, score: number) => {
    try {
      if (score < 1 || score > 10) {
        showSnackbar('Điểm phải từ 1 đến 10', 'error');
        return;
      }
      await api.patch(`/tasks/${taskId}/score`, { score });
      fetchTasksForIntern(taskModalIntern.id);
    } catch (err) {
      console.error("Chấm điểm thất bại:", err);
      showSnackbar('Chấm điểm thất bại', 'error');
    }
  };










  // ham modal prompt 
  const openNoteModal = (task: any, action: 'error' | 'reset') => {
    setNoteTargetTask(task);
    setNoteActionType(action);
    setNoteInput('');
    setNoteModalOpen(true);
  };

  const handleShowLog = async (taskId: number) => {
    try {
      const res = await api.get(`/task-logs/${taskId}`);
      setLogHistory(res.data.data);
      setLogDialogOpen(true);
    } catch (err) {
      console.error('Lỗi tải log:', err);
      showSnackbar('Failed to load logs!', 'error');
    }
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







  // lay danh sach tai lieu 
  const { data: documents, isLoading, isError, error } = useQuery({
    queryKey: ['documents', { status: 'approved' }],
    queryFn: async () => {
      const res = await api.get('/documents/all', {
        params: { status: 'approved' },
      });
      return res.data;
    },
  });

  // dùng use query để lấy danh sách công việc
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


  // hàm tạo công việc
  const handleCreateTask = async () => {
    if (!titleRef.current || !dateRef.current || !descEditorRef.current) return;
    const title = titleRef.current.value.trim();
    const dueDate = dateRef.current.value;
    const description = descEditorRef.current.getHTML();

    if (!title || !dueDate) {
      showSnackbar('Title and due date are required!', 'error');
      return;
    }
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);

    if (dueDateObj < today) {
      showSnackbar('Due date must be today or later!', 'error');
      return;
    }

    try {
      await api.post('/mentor/tasks', {
        title,
        dueDate,
        description,
        assignedTo: selectedIntern?.id || null,
        documentIds: selectedDocIds,
      });
      showSnackbar('Create task successfully!', 'success');
      setOpenDialog(false);
      titleRef.current.value = '';
      dateRef.current.value = '';
      setSelectedDocIds([]);
      descEditorRef.current.setHTML('');
      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
      if (selectedIntern) fetchTasksForIntern(selectedIntern.id);
    } catch (err) {
      console.error('Lỗi tạo task:', err);
      showSnackbar('Failed to create task!', 'error');
    }
  };
  // hàm xóa công việc
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
              showSnackbar('Delete task successfully!', 'success');
            } catch {
              showSnackbar('Delete task failed!', 'error');
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


  const filteredInterns = interns;


  const filteredMyTasks = Array.isArray(myTasks)
    ? myTasks.filter(
      (task) =>
        (!task.assignedTo || !task.assignedTo.id) &&
        `${task.title} ${task.description || ''}`.toLowerCase().includes(reuseSearch.toLowerCase())
    )
    : [];




  const openGradeModal = (task: any) => {
    setGradeTask(task);
    setGradeScore(task.score || 0);
  };


  // render giao diện 
  return (
    <div className="p-6">

      {/* Interns View */}
      {tab === 'interns' && (
        <>
          <Typography variant="h5" fontWeight={600} color="#243874" gutterBottom>
            Danh sách Intern
          </Typography>

          <TextField
            placeholder="Tìm kiếm intern"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 2, width: { xs: '100%', sm: '250px' } }}
          />

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tên</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Trường</strong></TableCell>
                  <TableCell><strong>Hành động</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInterns.map((intern: any) => (
                  <TableRow key={intern.id} hover>
                    <TableCell>{intern.name}</TableCell>
                    <TableCell>{intern.email}</TableCell>
                    <TableCell>{intern.school || 'Chưa có trường'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          setSelectedIntern(intern);
                          setOpenDialog(true);
                          setMode('new');
                        }}
                      >
                        Giao Task
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => setTopicModalIntern(intern)}
                      >
                        Xem Topic
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setTaskModalIntern(intern);
                          fetchTasksForIntern(intern.id);
                        }}
                      >
                        Xem Task
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}


      {/* Tasks View */}
      {tab === 'tasks' && (
        <>
          <Typography variant="h5" fontWeight={600} color="#243874" gutterBottom>
            Quản lý Task
          </Typography>

          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={() => {
              setSelectedIntern(null);
              setOpenDialog(true);
              setMode('new');
            }}
          >
            + Tạo Task
          </Button>

          <TextField
            placeholder="Tìm theo tiêu đề hoặc intern"
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 2, width: { xs: '100%', sm: '250px' } }}
          />


          <TableContainer component={Paper} sx={{ maxHeight: 600 }} ref={parentTaskRef}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Người nhận</TableCell>
                  <TableCell>Hạn</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hành động</TableCell>
                  <TableCell>Tài liệu</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Top padding để đẩy các row xuống đúng vị trí */}
                {taskVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow style={{ height: taskVirtualizer.getVirtualItems()[0].start }}>
                    <TableCell colSpan={7} style={{ padding: 0, border: "none" }} />
                  </TableRow>
                )}

                {taskVirtualizer.getVirtualItems().map((virtualRow) => {
                  const task = tasks[virtualRow.index];
                  return (
                    <TableRow hover key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setDescContent(task.description);
                            setDescDialogOpen(true);
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>

                      <TableCell
                        style={{ cursor: !task.assignedTo ? 'pointer' : 'default', color: !task.assignedTo ? 'blue' : 'inherit' }}
                        onClick={() => {
                          if (!task.assignedTo) {
                            setSelectedTaskId(task.id);
                            setOpenAssignDialog(true);
                          }
                        }}

                      >
                        {task.assignedTo?.name || task.assignedTo?.email || "Chưa giao"}
                      </TableCell>


                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {task.status}
                      </TableCell>
                      <TableCell>
                        <Button
                          color="error"
                          size="small"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Xoá
                        </Button>
                      </TableCell>
                      <TableCell>
                        {task.sharedDocuments?.length > 0 ? (
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedDoc(task.sharedDocuments[0]);
                              setDocDialogOpen(true);
                            }}
                          >
                            Xem
                          </Button>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontStyle="italic"
                          >
                            Không có
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Bottom padding để giữ chiều cao */}
                {taskVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow
                    style={{
                      height:
                        taskVirtualizer.getTotalSize() -
                        (taskVirtualizer.getVirtualItems().at(-1)?.end ?? 0),
                    }}
                  >
                    <TableCell colSpan={7} style={{ padding: 0, border: "none" }} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>



          {isFetchingNextPage && (
            <Typography textAlign="center" color="primary" py={2}>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải thêm...
            </Typography>
          )}
        </>
      )}




      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />


      {/* Dialog tạo task */}
      {openDialog && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedIntern
              ? `Giao task cho ${selectedIntern.name}`
              : "Tạo task mới"}
          </DialogTitle>

          <DialogContent dividers>
            {/* Chọn chế độ */}
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, value) => value && setMode(value)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="new">Task mới</ToggleButton>
              {selectedIntern && (
                <ToggleButton value="reuse">Chọn task có sẵn</ToggleButton>
              )}
            </ToggleButtonGroup>

            {mode === "new" ? (
              <>
                <TextField
                  fullWidth
                  label="Tiêu đề"
                  inputRef={titleRef}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="date"
                  inputRef={dateRef}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ mb: 2 }}>
                  <RichTextEditor ref={descEditorRef} />
                </Box>

                <DocumentSelectorDialog
                  status="approved"
                  documents={documents}
                  selectedDocIds={selectedDocIds}
                  onChange={setSelectedDocIds}
                />
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm task theo tiêu đề, mô tả..."
                  value={reuseSearch}
                  onChange={(e) => setReuseSearch(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ maxHeight: 256, overflowY: "auto" }}>
                  {filteredMyTasks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Không tìm thấy task phù hợp.
                    </Typography>
                  ) : (
                    filteredMyTasks.map((task) => (
                      <Paper
                        key={task.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          mb: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography fontWeight={500}>{task.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hạn: {task.dueDate}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={async () => {
                            try {
                              await api.patch(`/mentor/tasks/${task.id}/assign`, {
                                internId: selectedIntern.id,
                              });
                              queryClient.invalidateQueries({ queryKey: ["mentorTasks"] });
                              showSnackbar("Task assigned successfully!", "success");
                              setMyTasks((prev) => prev.filter((t) => t.id !== task.id));
                              if (tab === "tasks") {
                                const updated = await api.get("/mentor/tasks");
                                setMyTasks(updated.data);
                              }
                              setOpenDialog(false);
                              fetchTasksForIntern(selectedIntern.id);
                            } catch {
                              showSnackbar("Failed to assign task!", "error");
                            }
                          }}
                        >
                          Giao task
                        </Button>
                      </Paper>
                    ))
                  )}
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions>
            {mode === "new" && (
              <>
                <Button onClick={() => setOpenDialog(false)} color="inherit">
                  Huỷ
                </Button>
                <Button onClick={handleCreateTask} variant="contained">
                  Tạo Task
                </Button>
              </>
            )}
            {mode === "reuse" && (
              <Button onClick={() => setOpenDialog(false)} color="inherit">
                Đóng
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}


      {/* Xem danh sách task của 1 intern */}
      {taskModalIntern && (
        <Dialog
          open={!!taskModalIntern}
          onClose={() => setTaskModalIntern(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Task của Intern: {taskModalIntern.name}
          </DialogTitle>
          
          <DialogContent dividers sx={{ maxHeight: "80vh" }}>
            <TextField
              fullWidth
              placeholder="Tìm task theo tiêu đề, mô tả, trạng thái..."
              value={internTaskSearch}
              onChange={(e) => setInternTaskSearch(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
<Box display="flex" gap={2}>
  <Button
    variant="contained"
    color="primary"
    onClick={() => {
      const internTasks = tasksByIntern[taskModalIntern.id] || [];
      exportScoreReport(taskModalIntern.name, internTasks);
    }}
  >
    Xuất PDF
  </Button>

  <Button
    variant="outlined"
    color="success"
    onClick={() => {
      const internTasks = tasksByIntern[taskModalIntern.id] || [];
      exportScoreReportExcel(taskModalIntern.name, internTasks);
    }}
  >
    Xuất Excel
  </Button>
</Box>

            {(() => {
              const internTasks = tasksByIntern[taskModalIntern.id] || [];
              const filteredInternTasks = internTasks.filter((task) =>
                `${task.title} ${task.description} ${task.status}`
                  .toLowerCase()
                  .includes(internTaskSearch.toLowerCase())
              );

              if (filteredInternTasks.length === 0) {
                return (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontStyle="italic"
                  >
                    Không tìm thấy task phù hợp.
                  </Typography>
                );
              }

              return (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tiêu đề</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell>Hạn</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Hành động</TableCell>
                      <TableCell>Báo cáo</TableCell>
                      <TableCell>Lịch sử</TableCell>
                      {/* <TableCell>Điểm</TableCell> */}
                      <TableCell>Chấm điểm</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInternTasks.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                              setDescContent(task.description);
                              setDescDialogOpen(true);
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                        <TableCell>{task.dueDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              task.status === "assigned"
                                ? "Chưa nhận"
                                : task.status === "in_progress"
                                  ? "Đang làm"
                                  : task.status === "completed"
                                    ? "Hoàn thành"
                                    : "Lỗi"
                            }
                            color={
                              task.status === "completed"
                                ? "success"
                                : task.status === "in_progress"
                                  ? "primary"
                                  : task.status === "error"
                                    ? "error"
                                    : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {task.status === "in_progress" &&
                            (task.submittedText || task.submittedFile) &&
                            task.score == null && (
                              <Button
                                size="small"
                                color="warning"
                                onClick={() => openNoteModal(task, "error")}
                              >
                                Đánh lỗi
                              </Button>
                            )}

                          {(task.status === "completed" || task.status === "error") &&
                            task.score == null && (
                              <Button
                                size="small"
                                color="primary"
                                onClick={() => openNoteModal(task, "reset")}
                              >
                                Reset task
                              </Button>
                            )}

                          <Button
                            size="small"
                            color="error"
                            disabled={task.score != null} // vô hiệu hóa nếu đã có điểm
                            onClick={async () => {
                              if (!window.confirm("Bạn có chắc muốn xoá task này?")) return;
                              try {
                                await api.delete(`/mentor/tasks/${task.id}`);
                                fetchTasksForIntern(taskModalIntern.id);
                              } catch {
                                showSnackbar("Delete task failed!", "error");
                              }
                            }}
                          >
                            Xoá
                          </Button>


                        </TableCell>
                        <TableCell>
                          {task.submittedText || task.submittedFile ? (
                            <Button
                              size="small"
                              onClick={() => {
                                setReportContent(task.submittedText || "");
                                setReportFile(task.submittedFile || "");
                                setReportDialogOpen(true);
                              }}
                            >
                              Xem báo cáo
                            </Button>
                          ) : (
                            <Typography
                              variant="body2"
                              color={new Date(task.dueDate) < new Date() ? "error" : "text.secondary"} // đỏ nếu quá hạn
                              fontStyle="italic"
                            >
                              Chưa nộp
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleShowLog(task.id)}
                          >
                            Xem lịch sử
                          </Button>
                        </TableCell>

                        {/* {task.score != null ? (
    <Chip label={`${task.score} điểm`} color="success" size="small" />
  ) : (
    "Chưa chấm"
  )} */}

                        <TableCell>
                          {(task.submittedText || task.submittedFile) && task.score == null ? (
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Nhập điểm"
                              inputProps={{ min: 1, max: 10 }}
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                handleGradeTask(task.id, Number(e.target.value))
                              }
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === "Enter") {
                                  handleGradeTask(task.id, Number((e.target as HTMLInputElement).value));
                                }
                              }}

                              sx={{ width: 80 }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {task.score != null ? (
                                <Chip
                                  label={`${task.score} điểm`}
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  label="Không thể chấm"
                                  color="default"
                                  size="small"
                                  variant="outlined"
                                />
                              )}

                            </Typography>
                          )}
                        </TableCell>








                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setTaskModalIntern(null)} color="inherit">
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      )}



      {/* Dialog xem mô tả  */}
      <DescriptionViewerDialog
        open={descDialogOpen}
        onClose={() => setDescDialogOpen(false)}
        description={descContent}
      />
      {/* Xem báo cáo của intern */}


      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="600">
              Báo cáo của Intern
            </Typography>
            <Button
              size="small"
              color="inherit"
              onClick={() => setReportDialogOpen(false)}
            >
              Đóng
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {reportContent && (
            <Box mb={3}>
              <Typography fontWeight="500" mb={1}>
                Nội dung:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.875rem",
                  color: "grey.800"
                }}
              >
                {reportContent}
              </Paper>
            </Box>
          )}

          {reportFile && (
            <Box>
              <Typography fontWeight="500" mb={1}>
                File đính kèm:
              </Typography>
              <MuiLink
                component="a"
                href={`http://localhost:3000/uploads/tasks/${reportFile}`}
                download
                underline="hover"
                color="primary"
                variant="body2"
              >
                Tải file về
              </MuiLink>
            </Box>
          )}

          {!reportContent && !reportFile && (
            <Typography fontStyle="italic" color="text.secondary">
              Không có nội dung báo cáo.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>


      {/* Xem file word báo cáo của intern */}
      <Dialog
        open={docxDialogOpen}
        onClose={() => setDocxDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>Xem nội dung file Word</DialogTitle>
        <DialogContent
          dividers
          sx={{
            overflowY: 'auto',
          }}
        >
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: docxPreviewContent }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocxDialogOpen(false)} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xem log của công việc của intern */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          Lịch sử cập nhật trạng thái
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            overflowY: 'auto',
          }}
        >
          {logHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Chưa có lịch sử nào.
            </Typography>
          ) : (
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
              {logHistory.map((log: any, idx: number) => (
                <Box
                  component="li"
                  key={idx}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2">
                    <strong>Người cập nhật:</strong> {log.user?.name || 'Ẩn danh'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian:</strong> {new Date(log.createdAt).toLocaleString()}
                  </Typography>
                  {/* 
            <Typography variant="body2">
              <strong>Trạng thái:</strong> từ <em>{log.fromStatus}</em> → <em>{log.toStatus}</em>
            </Typography> 
            */}
                  {log.note && (
                    <Typography variant="body2">
                      <strong>Lý do:</strong> {log.note}
                    </Typography>
                  )}
                  {log.message && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      {log.message}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {noteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">
              {noteActionType === 'error' ? 'Đánh lỗi task' : 'Reset task'}
            </h2>
            <textarea
              rows={4}
              className="w-full border rounded p-2 mb-4"
              placeholder="Nhập lý do (tùy chọn)..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Huỷ
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={async () => {
                  if (!noteTargetTask) return;

                  try {
                    if (noteActionType === 'error') {
                      await api.patch(`/mentor/tasks/${noteTargetTask.id}/status`, {
                        status: 'error',
                        note: noteInput,
                      });
                      showSnackbar('Task đã được đánh lỗi', 'success');
                      setNoteModalOpen(false);
                      setTimeout(async () => {
                        try {
                          await api.patch(`/mentor/tasks/${noteTargetTask.id}/status`, {
                            status: 'assigned',
                            note: 'Reset tự động sau đánh lỗi',
                          });
                          if (taskModalIntern) fetchTasksForIntern(taskModalIntern.id);
                          queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                          showSnackbar('Task đã được reset tự động', 'success');
                        } catch {

                          showSnackbar('Reset task failed!', 'error');
                        }
                      }, 2000);
                    }

                    if (noteActionType === 'reset') {
                      await api.patch(`/mentor/tasks/${noteTargetTask.id}/status`, {
                        status: 'assigned',
                        note: noteInput,
                      });
                      if (taskModalIntern) fetchTasksForIntern(taskModalIntern.id);
                      queryClient.invalidateQueries({ queryKey: ['mentorTasks'] });
                      showSnackbar('Task đã được reset', 'success');
                    }

                    setNoteModalOpen(false);
                  } catch {
                    showSnackbar('Failed to update task status!', 'error');
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}





      {/* Quản lý topic riêng của intern */}
      {topicModalIntern && (
        <InternTopicManager
          intern={topicModalIntern}
          open={!!topicModalIntern}
          onClose={() => setTopicModalIntern(null)}
        />
      )}



      {/* Dialog xem tài liệu  */}
      <DocumentViewerDialog
        open={docDialogOpen}
        document={selectedDoc}
        onClose={() => setDocDialogOpen(false)}
      />

      <AssignInternDialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        taskId={selectedTaskId}
        onAssigned={() => queryClient.invalidateQueries({ queryKey: ['mentorTasks'] })}
      />

    </div>
  );
}
