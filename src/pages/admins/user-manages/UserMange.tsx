import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiEdit, FiTrash } from 'react-icons/fi';
import api from '../../../utils/axios';
import UserForm from './UserForm';
import type { UserType } from './UserForm';
import Select from 'react-select';
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import Toast from '../../../components/Toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback } from 'react';
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
  // const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'intern' | 'mentor' | 'assignment'>('intern');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [internSearch, setInternSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  // const debouncedSearch = useDebounce(userSearch, 500);
  const [debouncedSearch] = useDebounce(search, 500);

  const [mentorSearch, setMentorSearch] = useState('');
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);

  // thong bao toast 
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        internDropdownRef.current &&
        !internDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        mentorDropdownRef.current &&
        !mentorDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMentorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);




  // ham show toast
  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // tự ẩn sau 3s
  };




  const mentorDropdownRef = useRef<HTMLDivElement>(null);

  // search o select
  const [debouncedInternSearch] = useDebounce(internSearch, 300);
  const [debouncedMentorSearch] = useDebounce(mentorSearch, 300);


  const internDropdownRef = useRef<HTMLDivElement>(null);


  const [assignmentPage, setAssignmentPage] = useState(1);
  const assignmentLimit = 10;
  const [debouncedAssignmentSearch] = useDebounce(search, 500);

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
    queryKey: ['users', { tab, page, limit, search: debouncedSearch }],
    queryFn: async () => {
       console.log(' Fetching users at page:', page); 
      const res = await api.get('/admin/users', {
        params: {
          type: tab,
          page,
          limit,
          search: debouncedSearch,
        },
      });
      return res.data;
    },
    placeholderData: (prev) => prev,
  });


  const {
    data: assignmentPages,
    isLoading: isLoadingAssignments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchAssignments,
  } = useInfiniteQuery({
    queryKey: ['assignments', debouncedAssignmentSearch],
    
    queryFn: async ({ pageParam = 1 }) => {
      console.log(` Fetching assignments - page ${pageParam}`);
      const res = await api.get('/admin/assignments', {
        params: {
          search: debouncedAssignmentSearch,
          page: pageParam,
          limit: assignmentLimit,
        },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.flatMap(p => p.data).length;
      if (loadedCount >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    enabled: tab === 'assignment',
  });

  // tu dong cuon 
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tab !== 'assignment') return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [tab, hasNextPage, isFetchingNextPage, fetchNextPage]);






  

  const allAssignments = assignmentPages?.pages.flatMap(p => p.data) || [];
  const users: User[] = usersResponse?.data || [];
  const total = usersResponse?.total || 0;
  const totalPages = Math.ceil(total / limit);

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



const mentorLoadMoreRef = useRef<HTMLDivElement | null>(null);


const assignmentListRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: allAssignments.length,
  getScrollElement: () => assignmentListRef.current,
  estimateSize: useCallback(() => 50, []),
  overscan: 5,
});

  // 1. Gọi useInfiniteQuery để lấy intern chưa phân công
  const {
    data: internPages,
    fetchNextPage: fetchMoreInterns,
    hasNextPage: hasMoreInterns,
    isFetchingNextPage: isFetchingMoreInterns,
  } = useInfiniteQuery({
    queryKey: ['interns-unassigned', debouncedInternSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/admin/interns/unassigned', {
        params: {
          page: pageParam,
          limit: 10,
          search: debouncedInternSearch,
        },
      });
      return {
        data: res.data,
        total: res.data.length,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap(p => p.data).length;
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: tab === 'assignment',
  });


  const unassignedInterns = useMemo(() =>
    internPages?.pages?.flatMap(p => p.data) || [],
    [internPages]);



  const {
    data: mentorPages,
    fetchNextPage: fetchMoreMentors,
    hasNextPage: hasMoreMentors,
    isFetchingNextPage: isFetchingMoreMentors,
  } = useInfiniteQuery({
    queryKey: ['mentors', debouncedMentorSearch],
    queryFn: async ({ pageParam = 1 }) => {
  const res = await api.get('/admin/users', {
    params: {
      page: pageParam,
      limit: 10,
      search: debouncedMentorSearch,
      type: 'mentor',
    },
  });

  return {
    data: res.data?.data || [],    
    total: res.data?.total || 0,   
  };
},

    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: tab === 'assignment',
  });
useEffect(() => {
  if (!showMentorDropdown || !hasMoreMentors || isFetchingMoreMentors) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetchMoreMentors();
      }
    },
    { threshold: 1.0 }
  );

  const current = mentorLoadMoreRef.current;
  if (current) observer.observe(current);

  return () => {
    if (current) observer.unobserve(current);
  };
}, [showMentorDropdown, hasMoreMentors, isFetchingMoreMentors, fetchMoreMentors]);




  const interns = internPages?.pages.flatMap(p => p.data) || [];












  // intern da co phan cong 
  const assignedInternIds = useMemo(() => {
    return (
      assignmentPages?.pages
        ?.flatMap((page) =>
          page.data
            .map((a: any) => a?.intern?.id)
            .filter((id: any): id is number => id !== undefined && id !== null)
            .map((id: any) => id.toString())
        ) || []
    );
  }, [assignmentPages]);


  const filteredAssignableInterns = tab === 'assignment'
    ? internMentorData.data.filter(
      (u: any) =>
        u.type === 'intern' &&
        !assignForm.internIds.includes(u.id.toString()) &&
        !assignedInternIds.includes(u.id.toString())
    )
    : [];


  const mentors = internMentorData.data.filter((u: any) => u.type === 'mentor');

  // const fetchAssignments = async () => {
  //   try {
  //     const res = await api.get('/admin/assignments');
  //    setAssignments(res.data?.data || []);

  //   } catch (err) {
  //     console.error('Lỗi tải assignments:', err);
  //   }
  // };

  // useEffect(() => {
  //   fetchAssignments();
  // }, []);

  // const filteredAssignments = assignments.filter((a) =>
  //   `${a.intern?.name || ''} ${a.mentor?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  // );

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


useEffect(() => {
  if (!hasNextPage || isFetchingNextPage || tab !== 'assignment') return;

  const lastItem = rowVirtualizer.getVirtualItems().at(-1);
  if (!lastItem) return;

  if (lastItem.index >= allAssignments.length - 5) {
    fetchNextPage();
  }
}, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, tab]);

useEffect(() => {
  const virtualItems = rowVirtualizer.getVirtualItems();
  console.log('🔹 Rendered virtual rows:', virtualItems.map(item => item.index));
}, [allAssignments, rowVirtualizer.getVirtualItems()]);

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
                <div className="relative" ref={internDropdownRef}>
                  <div
                    className="border rounded px-2 py-1 flex flex-wrap gap-1 items-center min-h-[40px] cursor-text focus-within:ring-2 focus-within:ring-blue-400"
                    onClick={() => setShowDropdown(true)}
                  >
                    {assignForm.internIds.map((id) => {
                      const intern = unassignedInterns.find((u: any) => u?.id?.toString() === id);



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
                      {unassignedInterns
                        .filter((u: any) =>
                          u &&
                          typeof u.id !== 'undefined' &&
                          typeof u.name === 'string' &&
                          typeof u.email === 'string' &&
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









                      {filteredAssignableInterns.filter(
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
                <div className="col-span-1">
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Mentor</label> */}
                  <div className="relative" ref={mentorDropdownRef}>
                    <div
                      className="border rounded px-2 py-1 flex items-center min-h-[40px] cursor-text focus-within:ring-2 focus-within:ring-blue-400"
                      onClick={() => setShowMentorDropdown(true)}
                    >
                      <span className="text-sm text-gray-800 flex-1">
                        {mentorPages?.pages
                          .flatMap(p => p.data)
                          .find((m: any) => m.id.toString() === assignForm.mentorId)?.name || 'Chọn mentor...'}
                      </span>
                    </div>

                    {showMentorDropdown && (
                      <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow">
                        <input
                          type="text"
                          value={mentorSearch}
                          onChange={(e) => setMentorSearch(e.target.value)}
                          placeholder="Tìm mentor..."
                          className="w-full px-3 py-2 text-sm border-b outline-none"
                        />

                        {mentorPages?.pages
                          .flatMap(p => p.data)
                          .filter((m: any) =>
                            `${m.name} ${m.email}`.toLowerCase().includes(mentorSearch.toLowerCase())
                          )
                          .map((mentor: any) => (
                            <div
                              key={mentor.id}
                              className="px-3 py-2 text-sm hover:bg-blue-100 cursor-pointer"
                              onClick={() => {
                                setAssignForm({ ...assignForm, mentorId: mentor.id.toString() });
                                setShowMentorDropdown(false);
                              }}
                            >
                              {mentor.name} ({mentor.email})
                            </div>
                          ))}


                      {hasMoreMentors && (
  <div
    ref={mentorLoadMoreRef}
    className="text-center py-2 text-sm text-gray-400"
  >
    Đang tải thêm...
  </div>
)}

                      </div>
                    )}
                  </div>
                </div>


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
                  if (
      assignForm.internIds.length === 0 ||
      !assignForm.mentorId ||
      !assignForm.startDate ||
      !assignForm.endDate
    ) {
      showToastMessage('Vui lòng nhập đầy đủ thông tin để phân công!');
      return;
    }
                  try {
                    await api.post('/admin/assignments', assignForm);
                    await refetchAssignments();

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
         <div className="border rounded mt-4 h-[500px] overflow-y-auto" ref={assignmentListRef}>
  {/* Header */}
  <div className="grid grid-cols-5 bg-gray-100 text-sm font-semibold sticky top-0 z-10">
    <div className="p-2">Intern</div>
    <div className="p-2">Mentor</div>
    <div className="p-2">Start</div>
    <div className="p-2">End</div>
    <div className="p-2 text-center">Action</div>
  </div>

  
  {/* Virtualized Rows Container */}
<div
  style={{
    position: 'relative',
    height: `${rowVirtualizer.getTotalSize()}px`,
    width: '100%',
  }}
>


  <div style={{ height: rowVirtualizer.getVirtualItems()[0]?.start ?? 0 }} />

  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
    const a = allAssignments[virtualRow.index];
    return (
      <div
        key={a.id}
        className="grid grid-cols-5 border-b text-sm hover:bg-gray-50 items-center"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
          height: `${virtualRow.size}px`,
        }}
      >
        <div className="p-2">{a.intern?.name}</div>
        <div className="p-2">{a.mentor?.name}</div>
        <div className="p-2">{a.startDate}</div>
        <div className="p-2">{a.endDate}</div>
        <div className="p-2 text-center">
          <button
            className="text-red-500 hover:text-red-700"
            onClick={async () => {
              if (window.confirm('Xóa phân công này?')) {
                await api.delete(`/admin/assignments/${a.id}`);
                refetchAssignments();
              }
            }}
          >
            <FiTrash />
          </button>
        </div>
      </div>
    );
  })}
</div>

</div>

          {tab === 'assignment' && (
            <div ref={loadMoreRef} className="h-10" />
          )}



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
                    className={`w-8 h-8 rounded-full text-sm ${page === pg
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
      )}
   <Toast
  message={toastMessage}
  show={showToast}
  onClose={() => setShowToast(false)}
/>

    </div>
  );
}
