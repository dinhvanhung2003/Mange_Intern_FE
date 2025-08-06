import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import DescriptionViewerDialog from '../../components/DesciptionTask';
import { useAssignmentStore } from '../../stores/useAssignmentStore';
import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useCloseModal';
import DocumentViewerDialog, { Document } from '../../components/Document/DocumentViewer';
import { useOutletContext } from 'react-router-dom';
import { exportScoreReport } from "../../hooks/ExportGradeTask";
import { exportScoreReportExcel } from "../../hooks/ExportGradeTaskExcel";
import {
  Box,
  Typography,
  Chip,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
const socket = io('http://localhost:3000');


type ContextType = { showSnackbar: (message: string, severity?: "success" | "error" | "info" | "warning") => void };


export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
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

  // xu ly log khi chap nhan task 
  const [acceptNote, setAcceptNote] = useState('');
  const [acceptTaskId, setAcceptTaskId] = useState<number | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);


  // xem tài liệu
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);



  const { showSnackbar } = useOutletContext<ContextType>();



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
  useEffect(() => {
    if (assignment?.internId) {
      socket.emit('join', `user-${assignment.internId}`);
    }
  }, [assignment]);

  // Xem chi tiết mô tả 
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [descContent, setDescContent] = useState('');

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

  // hàm xử lý chấp nhận task
  const handleAccept = async () => {
    if (!acceptTaskId) return;
    try {
      await api.patch(`/interns/tasks/${acceptTaskId}/accept`, {
        note: acceptNote,
      });

      const updated = tasks.map(t =>
        t.id === acceptTaskId ? { ...t, status: 'in_progress' } : t
      );
      setTasks(updated);
      showSnackbar("Chấp nhận task thành công!", "success");
      // Reset
      setShowAcceptModal(false);
      setAcceptTaskId(null);
      setAcceptNote('');

    } catch (err) {
      console.error('Lỗi khi chấp nhận task:', err);
      showSnackbar("Chấp nhận task thất bại!", "error");
    }
  };


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
      showSnackbar("Nộp bài thành công!", "success");
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      showSnackbar("Nộp bài thất bại!", "error");
    }
  };

  // co 3 modal can dong 
  const logModalRef = useRef<HTMLDivElement>(null);
 
  return (
    <div className="w-full p-4">
      <Box mb={4} width="100%">
        <Typography variant="h5" fontWeight="500" color="#243874" display="flex" alignItems="center" gap={1}>
          Thông tin thực tập
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              size="small"
              sx={{ backgroundColor: "red", color: "white", fontWeight: "bold" }}
            />
          )}
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        {assignment ? (
          <>
            <Typography fontWeight="bold">Mentor: {assignment.mentor?.name}</Typography>
            <Typography>Từ ngày: {assignment.startDate}</Typography>
            <Typography>Đến ngày: {assignment.endDate}</Typography>
          </>
        ) : (
          <Typography color="text.secondary">Chưa có phân công thực tập</Typography>
        )}
      </Paper>

      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} mb={3}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm theo tên, mô tả, mentor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>
<Box display="flex" gap={2} justifyContent="flex-end" mb={2}>
  <Button
    variant="contained"
    color="primary"
    onClick={() => exportScoreReport("Báo cáo của tôi", tasks)}
  >
    Xuất PDF
  </Button>
  <Button
    variant="outlined"
    color="success"
    onClick={() => exportScoreReportExcel("Báo cáo của tôi", tasks)}
  >
    Xuất Excel
  </Button>
</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Hạn</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
              <TableCell>Log</TableCell>
              <TableCell>Tài liệu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary">Không có task phù hợp.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Button variant="text" onClick={() => { setDescContent(task.description); setDescDialogOpen(true); }}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                  <TableCell>{task.dueDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        task.status === 'assigned'
                          ? 'Chưa nhận'
                          : task.status === 'in_progress'
                            ? 'Đang làm'
                            : task.status === 'completed'
                              ? 'Hoàn thành'
                              : 'Lỗi'
                      }
                      color={
                        task.status === 'completed'
                          ? 'success'
                          : task.status === 'in_progress'
                            ? 'primary'
                            : task.status === 'error'
                              ? 'error'
                              : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.status === 'assigned' && (
                      <Button 
                        disabled={new Date(task.dueDate) < new Date()}
                      variant="contained" size="small" onClick={() => { setAcceptTaskId(task.id); setShowAcceptModal(true); }}>
                        Chấp nhận
                      </Button>
                    )}
                   {(task.status === 'in_progress' || task.status === 'error') && (
  <Button
    variant="contained"
    color="success"
    size="small"
    disabled={new Date(task.dueDate) < new Date()} // disable nếu quá hạn
    onClick={() => {
      setSubmitTaskId(task.id);
      setShowSubmitModal(true);
    }}
  >
    Nộp bài
  </Button>
)}

                    {task.status === 'error' && (
                      <Typography variant="caption" color="error">Yêu cầu làm lại</Typography>
                    )}
                    {task.status === 'completed' && (
    task.score != null ? (
      <Chip
        label={`${task.score} điểm`}
        color="success"
        size="small"
        variant="outlined"
        sx={{ ml: 1 }}
      />
    ) : (
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        Đợi chấm điểm
      </Typography>
    )
  )}
                  </TableCell>
                  <TableCell>
                    <Button variant="text" size="small" onClick={() => handleViewLogs(task.id)}>
                      Xem lịch sử
                    </Button>
                  </TableCell>
                  <TableCell>
                    {task.sharedDocuments?.length > 0 ? (
                      <Button variant="text" size="small" onClick={() => { setSelectedDocument(task.sharedDocuments[0]); setDocumentDialogOpen(true); }}>
                        Xem tài liệu
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Không có</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>



      {/* Modal nộp bài */}
      {showSubmitModal && (
        <Dialog
          open={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Nộp bài</DialogTitle>
          <DialogContent>
            <TextField
              label="Mô tả bài làm"
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
            />
            <Box my={2}>
              <input
                type="file"
                onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
              />
            </Box>
            <TextField
              label="Ghi chú thêm (nếu có)"
              multiline
              rows={3}
              fullWidth
              margin="normal"
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubmitModal(false)}>Huỷ</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
            >
              Nộp
            </Button>
          </DialogActions>
        </Dialog>

      )}
      {/* Modal xem log */}
      {logOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div ref={logModalRef} className="bg-white rounded-lg shadow p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
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
      {/* Hiển thị thông báo nếu có */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}

      {/* Xem mô tả chi tiết */}
      <DescriptionViewerDialog
        open={descDialogOpen}
        onClose={() => setDescDialogOpen(false)}
        description={descContent}
      />

      {/* Modal chấp nhận task */}
      {showAcceptModal && (
       

<Dialog
  open={showAcceptModal}
  onClose={() => setShowAcceptModal(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Chấp nhận Task</DialogTitle>
  <DialogContent>
    <TextField
      label="Nhập ghi chú khi chấp nhận (tuỳ chọn)"
      multiline
      rows={3}
      fullWidth
      margin="normal"
      value={acceptNote}
      onChange={(e) => setAcceptNote(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowAcceptModal(false)}>Huỷ</Button>
    <Button
      variant="contained"
      color="primary"
      onClick={handleAccept}
    >
      Xác nhận
    </Button>
  </DialogActions>
</Dialog>

      )}
      {/* Modal xem tài liệu */}
      <DocumentViewerDialog
        open={documentDialogOpen}
        document={selectedDocument}
        onClose={() => setDocumentDialogOpen(false)}
      />

    </div>
  );


}
