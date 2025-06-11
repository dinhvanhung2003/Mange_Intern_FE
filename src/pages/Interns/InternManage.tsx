import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import api from '../../utils/axios';

export default function MentorInterns() {
  console.log("re-render");
  const [interns, setInterns] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [tasksByIntern, setTasksByIntern] = useState<Record<number, any[]>>({});
  const [expandedIntern, setExpandedIntern] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    console.log("re-render");
    api.get('/mentor/interns')
      .then((res) => setInterns(res.data))
      .catch((err) => console.error('Lỗi tải interns:', err));
  }, []);

  const fetchTasksForIntern = async (internId: number) => {
    try {
      const res = await api.get(`/mentor/interns/${internId}/tasks`);
      setTasksByIntern((prev) => ({ ...prev, [internId]: res.data }));
    } catch (err) {
      console.error('Lỗi tải task của intern:', err);
    }
  };

  const handleAssignTask = async () => {
    const taskData = {
      title: titleRef.current?.value || '',
      description: descRef.current?.value || '',
      dueDate: dateRef.current?.value || '',
      assignedTo: selectedIntern.id,
    };

    if (!taskData.title || !taskData.dueDate) {
      alert('Vui lòng nhập tiêu đề và hạn hoàn thành!');
      return;
    }

    try {
      await api.post('/mentor/tasks', taskData);
      alert('Đã giao task thành công!');
      setOpenDialog(false);


      if (titleRef.current) titleRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      if (dateRef.current) dateRef.current.value = '';

      if (expandedIntern === selectedIntern.id) {
        fetchTasksForIntern(selectedIntern.id);
      }
    } catch (err) {
      console.error('Lỗi giao task:', err);
      alert('Giao task thất bại!');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Danh sách Intern đang hướng dẫn</Typography>

      <Box display="flex" gap={2} flexWrap="wrap">
        {interns.map((intern) => (
          <Card key={intern.id} sx={{ width: 350 }}>
            <CardContent>
              <Typography variant="h6">{intern.name}</Typography>
              <Typography variant="body2">{intern.email}</Typography>
              <Typography variant="body2" gutterBottom>{intern.school || 'Chưa có trường'}</Typography>

              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedIntern(intern);
                    setOpenDialog(true);
                  }}
                >
                  Giao task
                </Button>

                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    const shouldExpand = expandedIntern !== intern.id;
                    setExpandedIntern(shouldExpand ? intern.id : null);
                    if (shouldExpand && !tasksByIntern[intern.id]) {
                      fetchTasksForIntern(intern.id);
                    }
                  }}
                >
                  {expandedIntern === intern.id ? 'Ẩn task' : 'Xem task'}
                </Button>
              </Box>

              <Collapse in={expandedIntern === intern.id}>
                <List dense sx={{ mt: 1 }}>
                  {(tasksByIntern[intern.id] || []).map((task) => (
                    <div key={task.id}>
                      <ListItem
                        secondaryAction={
                          task.status === 'in_progress' && (
                            <Button
                              size="small"
                              color="success"
                              onClick={async () => {
                                try {
                                  await api.patch(`/mentor/tasks/${task.id}/complete`);
                                  fetchTasksForIntern(intern.id);
                                } catch (err) {
                                  console.log('Lỗi hoàn thành task:', err);
                                  alert('Lỗi khi hoàn thành task!');
                                }
                              }}
                            >
                              Hoàn thành
                            </Button>
                          )
                        }
                      >
                        <ListItemText
                          primary={task.title}
                          secondary={`Hạn: ${task.dueDate} | Trạng thái: ${task.status}`}
                        />
                      </ListItem>
                      <Divider />
                    </div>
                  ))}

                  {tasksByIntern[intern.id]?.length === 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>Chưa có task nào.</Typography>
                  )}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Dialog giao task */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Giao task cho {selectedIntern?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Tiêu đề"
              inputRef={titleRef}
              fullWidth
            />
            <TextField
              label="Mô tả"
              inputRef={descRef}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Hạn hoàn thành"
              type="date"
              InputLabelProps={{ shrink: true }}
              inputRef={dateRef}
              fullWidth
            />
            <Button variant="contained" onClick={handleAssignTask}>
              Giao Task
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

    </Box>
  );
}
