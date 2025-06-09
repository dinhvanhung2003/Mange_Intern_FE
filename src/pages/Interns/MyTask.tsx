import {
  Box, Typography, List, ListItem, ListItemText, Button, Chip
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/axios';

export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    api.get('/interns/assignment').then((res) => setAssignment(res.data));
    api.get('/interns/tasks').then((res) => setTasks(res.data));
  }, []);

  const handleAccept = async (id: number) => {
    await api.patch(`/interns/tasks/${id}/accept`);
    const updated = tasks.map(t => t.id === id ? { ...t, status: 'in_progress' } : t);
    setTasks(updated);
  };

  return (
    <Box p={3}>
      <Typography variant="h5">Thông tin thực tập</Typography>
      {assignment ? (
        <Box mb={3}>
          <Typography>Mentor: {assignment.mentor?.name}</Typography>
          <Typography>Từ ngày: {assignment.startDate}</Typography>
          <Typography>Đến ngày: {assignment.endDate}</Typography>
        </Box>
      ) : <Typography>Chưa có phân công thực tập</Typography>}

      <Typography variant="h6">Task được giao</Typography>
      <List>
        {tasks.map((task) => (
          <ListItem key={task.id} sx={{ borderBottom: '1px solid #eee' }}>
            <ListItemText
              primary={task.title}
              secondary={`Hạn: ${task.dueDate} | ${task.description}`}
            />
            <Chip label={task.status} sx={{ mr: 2 }} />
            {task.status === 'assigned' && (
              <Button variant="outlined" size="small" onClick={() => handleAccept(task.id)}>
                Chấp nhận
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
