import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Typography,
    CircularProgress,
    Box,
} from '@mui/material';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    assignedTo: User;
    assignedBy: User;
}

const TaskList: React.FC = () => {
    console.log('re-render');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const token = sessionStorage.getItem('accessToken');

        axios
            .get('http://localhost:3000/admin/tasks', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => setTasks(res.data))
            .catch((err) => console.error('Lỗi khi lấy task:', err.response))
            .finally(() => setLoading(false)); 
    }, []);

    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.assignedTo?.name.toLowerCase().includes(search.toLowerCase()) ||
            task.assignedBy?.name.toLowerCase().includes(search.toLowerCase()) ||
            String(task.id) === search.trim()
    );

    return (
        <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
                Tất cả task trong hệ thống
            </Typography>

            <TextField
                variant="outlined"
                placeholder="Search by Task Title, Intern, Mentor, or ID"
                fullWidth
                margin="normal"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" padding={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tiêu đề</TableCell>
                                <TableCell>Intern</TableCell>
                                <TableCell>Mentor</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Hạn chót</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.id}</TableCell>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{task.assignedTo?.name || '---'} (#{task.assignedTo?.id || '-'})</TableCell>
                                    <TableCell>{task.assignedBy?.name || '---'} (#{task.assignedBy?.id || '-'})</TableCell>
                                    <TableCell>{task.status}</TableCell>
                                    <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

export default TaskList;
