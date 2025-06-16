import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Button, Chip, Snackbar, Badge, TextField, Paper, Divider
} from '@mui/material';
import api from '../../utils/axios';

const socket = io('http://localhost:3000');

export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/interns/assignment').then((res) => {
      setAssignment(res.data);
      if (res.data?.internId) {
        socket.emit('join', `user-${res.data.internId}`);
      }
    });

    api.get('/interns/tasks').then((res) => setTasks(res.data));
  }, []);

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

  const filteredTasks = tasks.filter(task =>
    `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3} maxWidth="800px" mx="auto">
      <Typography variant="h4" gutterBottom>
        <Badge badgeContent={unreadCount} color="error">
          Thông tin thực tập
        </Badge>
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        {assignment ? (
          <>
            <Typography variant="h6">Mentor: {assignment.mentor?.name}</Typography>
            <Typography variant="body1">Từ ngày: {assignment.startDate}</Typography>
            <Typography variant="body1">Đến ngày: {assignment.endDate}</Typography>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">Chưa có phân công thực tập</Typography>
        )}
      </Paper>

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Task được giao</Typography>
        <TextField
          size="small"
          placeholder="Tìm task..."
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <List component={Paper} variant="outlined">
        {filteredTasks.length === 0 ? (
          <Typography sx={{ p: 2 }} color="text.secondary">Không có task phù hợp.</Typography>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id}>
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {task.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {task.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hạn: {task.dueDate}
                      </Typography>
                    </>
                  }
                />
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <Chip
                    label={task.status === 'assigned' ? 'Chưa nhận' :
                      task.status === 'in_progress' ? 'Đang làm' : 'Hoàn thành'}
                    color={task.status === 'completed' ? 'success' :
                      task.status === 'in_progress' ? 'primary' : 'warning'}
                    sx={{ mb: 1 }}
                  />
                  {task.status === 'assigned' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAccept(task.id)}
                    >
                      Chấp nhận
                    </Button>
                  )}
                </Box>
              </ListItem>
              <Divider />
            </div>
          ))
        )}
      </List>

      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        message={notification}
      />
    </Box>
  );
}
