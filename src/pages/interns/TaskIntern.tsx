import io from 'socket.io-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/axios';
import DescriptionViewerDialog from '../../components/DesciptionTask';
import DocumentViewerDialog, { Document } from '../../components/Document/DocumentViewer';
import { useAssignmentStore } from '../../stores/useAssignmentStore';
import { useOutletContext } from 'react-router-dom';
import { exportScoreReport } from "../../hooks/ExportGradeTask";
import { exportScoreReportExcel } from "../../hooks/ExportGradeTaskExcel";
import { useQueryClient } from '@tanstack/react-query';
import { useDebounced } from '../../hooks/useDebounce';
import { useTasks, useAcceptTask, useSubmitTask, Task } from '../../hooks/useTasks';

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
  TablePagination,
} from "@mui/material";

type ContextType = { showSnackbar: (message: string, severity?: "success" | "error" | "info" | "warning") => void };

// Socket
const socket = io('http://localhost:3000');

export default function MyTasks() {
  // ===== UI & Store =====
  const { showSnackbar } = useOutletContext<ContextType>();
  const { assignment } = useAssignmentStore();

  // ===== Search & Debounce =====
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);

  // ===== Date range (tuỳ chọn nếu dùng FullCalendar) =====
  const [range, setRange] = useState<{ start?: string; end?: string }>({});

  // ===== Paging =====
  const [page, setPage] = useState(0);           // TablePagination 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ===== Query =====
  const { data, isLoading } = useTasks({
    search: debouncedSearch.trim(),
    page: page + 1,                               // API 1-based
    limit: rowsPerPage,
    start: range.start,
    end: range.end,
  });
  const tasks = data?.data ?? [];
  const total = data?.total ?? 0;

  // ===== Socket join room =====
  useEffect(() => {
    if (assignment?.internId) {
      socket.emit('join', `user-${assignment.internId}`);
    }
  }, [assignment]);

  // ===== Notification state =====
  const [notification, setNotification] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ===== React Query client =====
  const qc = useQueryClient();

  // Khi có task mới, ưu tiên update ngay trang 1 nếu đang ở trang 1, else invalidate
 useEffect(() => {
  const onAssigned = (task: Task) => {
    if (page === 0) {
      qc.setQueryData(
        ['tasks', { search: debouncedSearch.trim(), page: 1, limit: rowsPerPage, start: range.start, end: range.end }],
        (old: any) => {
          if (!old) return old;
          return { ...old, data: [task, ...old.data].slice(0, rowsPerPage), total: (old.total ?? 0) + 1 };
        }
      );
    } else {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    }
    setNotification(`Bạn vừa được giao task: ${task.title}`);
    setUnreadCount((c) => c + 1);
  };

  socket.on('task_assigned', onAssigned);

  // cleanup: phải trả về void
  return () => {
    socket.off('task_assigned', onAssigned);
  };
}, [qc, page, rowsPerPage, debouncedSearch, range.start, range.end]);


  // ===== Dialogs & state =====
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [descContent, setDescContent] = useState('');
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Accept
  const [acceptNote, setAcceptNote] = useState('');
  const [acceptTaskId, setAcceptTaskId] = useState<number | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Submit
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitText, setSubmitText] = useState('');
  const [submitNote, setSubmitNote] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);

  // Logs
  const [logs, setLogs] = useState<Array<{ createdAt: string; fromStatus: string; toStatus: string; note?: string; message?: string; fileUrl?: string }>>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // ===== Mutations =====
  const acceptMutation = useAcceptTask();
  const submitMutation = useSubmitTask();

  const handleAccept = async () => {
    if (!acceptTaskId) return;
    try {
      await acceptMutation.mutateAsync({ id: acceptTaskId, note: acceptNote });
      showSnackbar("Chấp nhận task thành công!", "success");
      setShowAcceptModal(false);
      setAcceptTaskId(null);
      setAcceptNote('');
    } catch {
      showSnackbar("Chấp nhận task thất bại!", "error");
    }
  };

  const handleSubmit = async () => {
    if (!submitTaskId) return;
    const formData = new FormData();
    formData.append('submittedText', submitText);
    formData.append('note', submitNote);
    if (submitFile) formData.append('file', submitFile);

    try {
      await submitMutation.mutateAsync({ id: submitTaskId, formData });
      setShowSubmitModal(false);
      setSubmitText('');
      setSubmitNote('');
      setSubmitFile(null);
      showSnackbar("Nộp bài thành công!", "success");
    } catch {
      showSnackbar("Nộp bài thất bại!", "error");
    }
  };

  const handleViewLogs = async (taskId: number) => {
    setLoadingLogs(true);
    try {
      const res = await api.get(`/task-logs/${taskId}`);
      setLogs(res.data.data);
      setLogOpen(true);
    } catch {
      showSnackbar('Lỗi khi tải log', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="w-full p-4">
      {/* Header */}
      <Box mb={4} width="100%">
        <Typography variant="h5" fontWeight="500" color="#243874" display="flex" alignItems="center" gap={1}>
          Thông tin thực tập
          {unreadCount > 0 && (
            <Chip label={unreadCount} size="small" sx={{ backgroundColor: "red", color: "white", fontWeight: "bold" }} />
          )}
        </Typography>
      </Box>

      {/* Assignment */}
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

      {/* Tìm kiếm */}
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} mb={3}>
        <TextField
          fullWidth size="small"
          placeholder="Tìm kiếm theo tên, mô tả, mentor..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }} // reset trang khi đổi search
        />
      </Box>

      {/* Export */}
      <Box display="flex" gap={2} justifyContent="flex-end" mb={2}>
        <Button variant="contained" color="primary" onClick={() => exportScoreReport("Báo cáo của tôi", tasks)}>
          Xuất PDF
        </Button>
        <Button variant="outlined" color="success" onClick={() => exportScoreReportExcel("Báo cáo của tôi", tasks)}>
          Xuất Excel
        </Button>
      </Box>

      {/* Bảng */}
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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}><Typography>Đang tải...</Typography></TableCell>
              </TableRow>
            )}

            {!isLoading && tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary">Không có task phù hợp.</Typography>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <Button
                    variant="text"
                    onClick={() => { setDescContent(task.description); setDescDialogOpen(true); }}
                  >
                    Xem chi tiết
                  </Button>
                </TableCell>
                <TableCell>{task.dueDate}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      task.status === 'assigned' ? 'Chưa nhận'
                        : task.status === 'in_progress' ? 'Đang làm'
                        : task.status === 'completed' ? 'Hoàn thành'
                        : 'Lỗi'
                    }
                    color={
                      task.status === 'completed' ? 'success'
                        : task.status === 'in_progress' ? 'primary'
                        : task.status === 'error' ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                  {task.status === 'completed' && (
                    task.score != null ? (
                      <Chip label={`${task.score} điểm`} color="success" size="small" variant="outlined" sx={{ ml: 1 }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        Đợi chấm điểm
                      </Typography>
                    )
                  )}
                </TableCell>
                <TableCell>
                  {task.status === 'assigned' && (
                    <Button
                      disabled={new Date(task.dueDate) < new Date()}
                      variant="contained" size="small"
                      onClick={() => { setAcceptTaskId(task.id); setShowAcceptModal(true); }}
                    >
                      Chấp nhận
                    </Button>
                  )}

                  {(task.status === 'in_progress' || task.status === 'error') && (
                    <Button
                      variant="contained" color="success" size="small"
                      disabled={new Date(task.dueDate) < new Date()}
                      onClick={() => { setSubmitTaskId(task.id); setShowSubmitModal(true); }}
                      sx={{ ml: 1 }}
                    >
                      Nộp bài
                    </Button>
                  )}

                  {task.status === 'error' && (
                    <Typography variant="caption" color="error" sx={{ ml: 1 }}>Yêu cầu làm lại</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="text" size="small" onClick={() => handleViewLogs(task.id)}>
                    Xem lịch sử
                  </Button>
                </TableCell>
                <TableCell>
  {task.sharedDocuments?.length ? (
    <Button
      variant="text"
      size="small"
      onClick={() => {
        const firstDoc = task.sharedDocuments?.[0];
        if (firstDoc) {
          setSelectedDocument(firstDoc);
          setDocumentDialogOpen(true);
        }
      }}
    >
      Xem tài liệu
    </Button>
  ) : (
    <Typography variant="caption" color="text.secondary">Không có</Typography>
  )}
</TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Phân trang */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Số dòng mỗi trang"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : 'nhiều'}`}
        />
      </TableContainer>

      {/* Thông báo */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}

      {/* Xem mô tả chi tiết */}
      <DescriptionViewerDialog open={descDialogOpen} onClose={() => setDescDialogOpen(false)} description={descContent} />

      {/* Modal chấp nhận task */}
      <Dialog open={showAcceptModal} onClose={() => setShowAcceptModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Chấp nhận Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Nhập ghi chú khi chấp nhận (tuỳ chọn)"
            multiline rows={3} fullWidth margin="normal"
            value={acceptNote} onChange={(e) => setAcceptNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAcceptModal(false)}>Huỷ</Button>
          <Button variant="contained" color="primary" onClick={handleAccept}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* Modal nộp bài */}
      <Dialog open={showSubmitModal} onClose={() => setShowSubmitModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nộp bài</DialogTitle>
        <DialogContent>
          <TextField
            label="Mô tả bài làm" multiline rows={4} fullWidth margin="normal"
            value={submitText} onChange={(e) => setSubmitText(e.target.value)}
          />
          <Box my={2}>
            <input type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] || null)} />
          </Box>
          <TextField
            label="Ghi chú thêm (nếu có)" multiline rows={3} fullWidth margin="normal"
            value={submitNote} onChange={(e) => setSubmitNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitModal(false)}>Huỷ</Button>
          <Button variant="contained" color="success" onClick={handleSubmit}>Nộp</Button>
        </DialogActions>
      </Dialog>

      {/* Modal xem log */}
      <Dialog open={logOpen} onClose={() => setLogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Lịch sử cập nhật task</DialogTitle>
        <DialogContent>
          {loadingLogs ? (
            <Typography>Đang tải...</Typography>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary" fontStyle="italic">Chưa có log</Typography>
          ) : (
            <ul className="space-y-3 text-sm">
              {logs.map((log, idx) => (
                <li key={idx} className="border p-3 rounded">
                  <p><strong>Thời gian:</strong> {new Date(log.createdAt).toLocaleString()}</p>
                  <p><strong>Trạng thái:</strong> {log.fromStatus} → {log.toStatus}</p>
                  {log.note && <p><strong>Ghi chú:</strong> {log.note}</p>}
                  {log.message && <p className="text-gray-600 italic">{log.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Modal xem tài liệu */}
      <DocumentViewerDialog open={documentDialogOpen} document={selectedDocument} onClose={() => setDocumentDialogOpen(false)} />
    </div>
  );
}
