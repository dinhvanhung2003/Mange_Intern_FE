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
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import UserForm from './UserForm';

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
  const [tab, setTab] = useState<'intern' | 'mentor' | 'assignment'>('intern');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const assignedInternIds = new Set(assignments.map((a) => a.intern?.id));
  // tim kiem de gan 
  const [internSearch, setInternSearch] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [assignForm, setAssignForm] = useState({
    internIds: [] as string[],
    mentorId: '',
    startDate: '',
    endDate: '',
  });
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
  const fetchAssignments = async () => {
    const res = await api.get('/admin/assignments');
    setAssignments(res.data);
  };
  const resolvedType: 'intern' | 'mentor' | undefined =
    editingUser?.type === 'intern' || editingUser?.type === 'mentor'
      ? editingUser.type
      : tab === 'intern' || tab === 'mentor'
        ? tab
        : undefined;

  useEffect(() => {
    fetchUsers();
    fetchAssignments();
  }, []);
  const filteredAssignments = assignments.filter((a) =>
  `${a.intern?.name || ''} ${a.mentor?.name || ''}`
    .toLowerCase()
    .includes(search.toLowerCase())
);
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
         <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#243874' }}>User Management</h2>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary">
            <Tab label="Interns" value="intern" />
            <Tab label="Mentors" value="mentor" />
            <Tab label="Assignments" value="assignment" />
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
      ) :
        (tab === 'intern' || tab === 'mentor') && (
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



      {tab === 'assignment' && (
        <>
          {/* Form gán */}
          <Box mb={2} display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <Autocomplete
              multiple
              options={users.filter(
                (u) => u.type === 'intern' && !assignedInternIds.has(u.id)
              )}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={users.filter((u) =>
                assignForm.internIds.includes(u.id.toString())
              )}
              onChange={(event, newValue) => {
                setAssignForm({
                  ...assignForm,
                  internIds: newValue.map((u) => u.id.toString()),
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Chọn interns" variant="outlined" />
              )}
              sx={{ minWidth: 300 }}
            />

            <Autocomplete
              options={users.filter((u) => u.type === 'mentor')}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={
                users.find((u) => u.id.toString() === assignForm.mentorId) || null
              }
              onChange={(event, newValue) => {
                setAssignForm({
                  ...assignForm,
                  mentorId: newValue ? newValue.id.toString() : '',
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Chọn mentor" variant="outlined" />
              )}
              sx={{ minWidth: 250 }}
            />

            <TextField
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={assignForm.startDate}
              onChange={(e) =>
                setAssignForm({ ...assignForm, startDate: e.target.value })
              }
            />

            <TextField
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={assignForm.endDate}
              onChange={(e) =>
                setAssignForm({ ...assignForm, endDate: e.target.value })
              }
            />

            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await api.post('/admin/assignments', assignForm);
                  fetchAssignments();
                  alert('Gán thành công!');
                  setAssignForm({
                    internIds: [],
                    mentorId: '',
                    startDate: '',
                    endDate: '',
                  });
                } catch (err: any) {
                  console.error('Lỗi khi gán:', err.response?.data || err.message);
                  alert(
                    `Gán thất bại: ${err.response?.data?.message || err.message
                    }`
                  );
                }
              }}
            >
              GÁN INTERNS
            </Button>
          </Box>


          {/* Danh sách assignment */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern</TableCell>
                <TableCell>Mentor</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.intern?.name}</TableCell>
                  <TableCell>{a.mentor?.name}</TableCell>
                  <TableCell>{a.startDate}</TableCell>
                  <TableCell>{a.endDate}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={async () => {
                        if (window.confirm('Xóa phân công này?')) {
                          await api.delete(`/admin/assignments/${a.id}`);
                          fetchAssignments();
                        }

                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingUser(null); }} maxWidth="sm" fullWidth>
        {/* <DialogTitle>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle> */}
        <DialogContent>
          <UserForm
            type={resolvedType}
            initialData={
              editingUser
                ? {
                  name: editingUser.name,
                  email: editingUser.email,
                  bio: editingUser.bio || '',
                  school: editingUser.school || '',
                  major: editingUser.major || '',
                  phone: editingUser.phone || '',
                  linkedinLink: editingUser.linkedinLink || '',
                  expertise: editingUser.expertise || '',
                }
                : undefined
            }
            onClose={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            onSubmit={(data) => {
              const req = editingUser
                ? api.put(`/users/${editingUser.id}`, data)
                : api.post('/users', { ...data, type: resolvedType });

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
