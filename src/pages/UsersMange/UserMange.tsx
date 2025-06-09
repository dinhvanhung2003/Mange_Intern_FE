import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import InternForm from '../Interns/InternForm';

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
  bio?: string;
  school?: string;
  major?: string;
  phone?: string;
  linkedinLink?: string;
  expertise?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'intern' | 'mentor'>('intern');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi tải users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((u) => u.type === tab)
    .filter((u) =>
      `${u.name}${u.email}${u.id}`.toLowerCase().includes(search.toLowerCase())
    );

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Xóa user "${name}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi xoá:', err);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>User Management</h2>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary">
            <Tab label="Interns" value="intern" />
            <Tab label="Mentors" value="mentor" />
          </Tabs>
        </Box>
        <Box display="flex" gap={2}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={() => setShowForm(true)}>
            + New User
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              {tab === 'intern' ? (
                <>
                  <TableCell>School</TableCell>
                  <TableCell>Major</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>LinkedIn</TableCell>
                </>
              ) : (
                <TableCell>Expertise</TableCell>
              )}
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                {tab === 'intern' ? (
                  <>
                    <TableCell>{user.school || '—'}</TableCell>
                    <TableCell>{user.major || '—'}</TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>{user.linkedinLink || '—'}</TableCell>
                  </>
                ) : (
                  <TableCell>{user.expertise || '—'}</TableCell>
                )}
                <TableCell align="center">
                  <IconButton onClick={() => { setEditingUser(user); setShowForm(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user.id, user.name)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingUser(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        <DialogContent>
          <InternForm
            initialData={editingUser || undefined}
            onClose={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            onSubmit={(data) => {
              const req = editingUser
                ? api.put(`/users/${editingUser.id}`, data)
                : api.post('/users', data);

              req.then(() => {
                fetchUsers();
                setShowForm(false);
                setEditingUser(null);
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
