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

  const [internSearch, setInternSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);



   // thong bao toast 
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);


  // ham show toast
  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // tự ẩn sau 3s
  };



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
          <div className="w-full bg-white border rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Gán Interns cho Mentor</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Intern Select/Search */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Interns</label>
                <div className="relative">
                  <div
                    className="border rounded px-2 py-1 flex flex-wrap gap-1 items-center min-h-[40px] cursor-text focus-within:ring-2 focus-within:ring-blue-400"
                    onClick={() => setShowDropdown(true)}
                  >
                    {assignForm.internIds.map((id) => {
                      const intern = assignableInterns.find((u: any) => u.id.toString() === id);
                      if (!intern) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          <span>{intern.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignForm({
                                ...assignForm,
                                internIds: assignForm.internIds.filter((i) => i !== id),
                              });
                            }}
                            className="ml-1 text-blue-600 hover:text-red-600"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                    <input
                      type="text"
                      className="flex-1 min-w-[100px] px-1 py-1 outline-none text-sm"
                      placeholder="Tìm intern..."
                      value={internSearch}
                      onChange={(e) => setInternSearch(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>

                  {showDropdown && (
                    <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-40 overflow-y-auto shadow">
                      {assignableInterns
                        .filter(
                          (u: any) =>
                            !assignForm.internIds.includes(u.id.toString()) &&
                            `${u.name} ${u.email}`.toLowerCase().includes(internSearch.toLowerCase())
                        )
                        .map((u: any) => (
                          <li
                            key={u.id}
                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                            onClick={() => {
                              setAssignForm((prev) => ({
                                ...prev,
                                internIds: [...prev.internIds, u.id.toString()],
                              }));
                              setInternSearch('');
                              setShowDropdown(true);
                            }}
                          >
                            {u.name} ({u.email})
                          </li>
                        ))}
                      {assignableInterns.filter(
                        (u: any) =>
                          !assignForm.internIds.includes(u.id.toString()) &&
                          `${u.name} ${u.email}`.toLowerCase().includes(internSearch.toLowerCase())
                      ).length === 0 && (
                          <li className="px-3 py-2 text-gray-500 italic text-sm">Không tìm thấy intern</li>
                        )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Mentor Select */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Mentor</label>
                <Select
                  options={mentorOptions}
                  value={mentorOptions.find((opt: any) => opt.value === assignForm.mentorId)}
                  onChange={(selected) =>
                    setAssignForm({ ...assignForm, mentorId: selected?.value || '' })
                  }
                />
              </div>

              {/* Date Pickers */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-1 text-sm"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-1 text-sm"
                  value={assignForm.endDate}
                  onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                className="bg-blue-500 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg shadow transition"
                onClick={async () => {
                  try {
                    await api.post('/admin/assignments', assignForm);
                    await fetchAssignments();
                   showToastMessage('Assign success!')
                    setAssignForm({ internIds: [], mentorId: '', startDate: '', endDate: '' });
                  } catch (err: any) {
                    showToastMessage(`Assign fail!: ${err.response?.data?.message || err.message}`);
                  }
                }}
              >
                GÁN INTERNS
              </button>
            </div>
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
          {/* Pagination - MUI Style Inspired */}
<div className="flex justify-center items-center gap-1 mt-6 text-sm text-gray-800">
  <button
    onClick={() => setPage((p) => Math.max(p - 1, 1))}
    disabled={page === 1}
    className="px-2 py-1 hover:underline disabled:text-gray-400"
  >
    &lt;
  </button>

  {[...Array(totalPages)].map((_, i) => {
    const pg = i + 1;
    if (pg === 1 || pg === totalPages || (pg >= page - 1 && pg <= page + 1)) {
      return (
        <button
          key={pg}
          onClick={() => setPage(pg)}
          className={`w-8 h-8 rounded-full text-sm ${
            page === pg
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {pg}
        </button>
      );
    }
    if (
      (pg === page - 2 && page > 4) ||
      (pg === page + 2 && page < totalPages - 3)
    ) {
      return <span key={`dots-${pg}`} className="px-2">...</span>;
    }
    return null;
  })}

  <button
    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
    disabled={page === totalPages}
    className="px-2 py-1 hover:underline disabled:text-gray-400"
  >
    &gt;
  </button>
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
