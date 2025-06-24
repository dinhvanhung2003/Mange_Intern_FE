import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiEdit, FiTrash } from 'react-icons/fi';
import api from '../../utils/axios';
import UserForm from './UserForm';
import type { UserType } from './UserForm';
import Select from 'react-select';
import { useMemo } from 'react';
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
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'intern' | 'mentor' | 'assignment'>('intern');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [assignForm, setAssignForm] = useState({
    internIds: [] as string[],
    mentorId: '',
    startDate: '',
    endDate: '',
  });

  // Dữ liệu user cho table
  const {
    data: usersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['users', { tab, page, limit, search }],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { type: tab, page, limit, search },
      });
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  const users: User[] = usersResponse?.data || [];
  const total = usersResponse?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const assignedInternIds = new Set(assignments.map((a) => a.intern?.id));
  const resolvedType = editingUser?.type || (tab !== 'assignment' ? tab : undefined);

  // Dữ liệu user dùng cho assignment 
  const { data: internMentorData = { data: [] } } = useQuery({
    queryKey: ['assign-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { page: 1, limit: 1000 },
      });
      return res.data;
    },
    enabled: tab === 'assignment',
  });

  const assignableInterns = internMentorData.data.filter(
    (u: any) => u.type === 'intern' && !assignedInternIds.has(u.id)
  );
  const mentors = internMentorData.data.filter((u: any) => u.type === 'mentor');

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/admin/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Lỗi tải assignments:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const filteredAssignments = assignments.filter((a) =>
    `${a.intern?.name || ''} ${a.mentor?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Xóa user "${name}"?`)) {
      try {
        await api.delete(`/users/${id}`);
        refetch();
      } catch (err) {
        console.error('Lỗi xoá:', err);
      }
    }
  };
const internOptions = useMemo(() => {
  return internMentorData.data
    .filter((u: any) => u.type === 'intern')
    .map((u: any) => ({
      value: u.id.toString(),
      label: `${u.name} (${u.email})`,
    }));
}, [internMentorData.data]);





 const mentorOptions = useMemo(() => {
  return internMentorData.data
    .filter((u: any) => u.type === 'mentor')
    .map((u: any) => ({
      value: u.id.toString(),
      label: `${u.name} (${u.email})`,
    }));
}, [internMentorData.data]);




  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-blue-900">User Management</h2>
          <div className="mt-2 flex space-x-4 border-b">
            {['intern', 'mentor', 'assignment'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t as any);
                  setPage(1);
                }}
                className={`pb-2 px-2 ${tab === t
                  ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                  : 'text-gray-600'
                  }`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {tab !== 'assignment' && (
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              onClick={() => setShowForm(true)}
            >
              + New User
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto" />
        </div>
      ) : tab === 'assignment' ? (
        <>
          {/* Assignment Form */}
          <div className="mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Interns</label>
           <Select
  isMulti
  options={internOptions}
  value={internOptions.filter((opt:any) => assignForm.internIds.includes(opt.value))}
  onChange={(selected) =>
    setAssignForm({ ...assignForm, internIds: selected.map((s) => s.value) })
  }
/>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Mentor</label>
             <Select
  options={mentorOptions}
  value={mentorOptions.find((opt:any) => opt.value === assignForm.mentorId)}
  onChange={(selected) =>
    setAssignForm({ ...assignForm, mentorId: selected?.value || '' })
  }
/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={assignForm.endDate}
                onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
              />
            </div>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={async () => {
                try {
                  await api.post('/admin/assignments', assignForm);
                  await fetchAssignments();
                  alert('Gán thành công!');
                  setAssignForm({ internIds: [], mentorId: '', startDate: '', endDate: '' });
                } catch (err: any) {
                  alert(`Gán thất bại: ${err.response?.data?.message || err.message}`);
                }
              }}
            >
              GÁN INTERNS
            </button>
          </div>

          {/* Assignment Table */}
          <table className="w-full text-sm border mt-4">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Intern</th>
                <th className="p-2">Mentor</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{a.intern?.name}</td>
                  <td className="p-2">{a.mentor?.name}</td>
                  <td className="p-2">{a.startDate}</td>
                  <td className="p-2">{a.endDate}</td>
                  <td className="p-2 text-center">
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={async () => {
                        if (window.confirm('Xóa phân công này?')) {
                          await api.delete(`/admin/assignments/${a.id}`);
                          fetchAssignments();
                        }
                      }}
                    >
                      <FiTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          {/* User Table */}
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                {tab === 'intern' ? (
                  <>
                    <th className="p-2">School</th>
                    <th className="p-2">Major</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">LinkedIn</th>
                  </>
                ) : (
                  <th className="p-2">Expertise</th>
                )}
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  {tab === 'intern' ? (
                    <>
                      <td className="p-2">{user.school || '—'}</td>
                      <td className="p-2">{user.major || '—'}</td>
                      <td className="p-2">{user.phone || '—'}</td>
                      <td className="p-2">{user.linkedinLink || '—'}</td>
                    </>
                  ) : (
                    <td className="p-2">{user.expertise || '—'}</td>
                  )}
                  <td className="p-2 text-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowForm(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Trang {page} / {totalPages || 1}
            </div>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-4 rounded shadow-lg">
            <UserForm
              type={resolvedType as UserType | undefined}
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
                  refetch();
                  setShowForm(false);
                  setEditingUser(null);
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
