import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import InternProfileModal from './InternProfileModal';

interface InternProfile {
  name?: string;
  school?: string;
  major?: string;
  phone?: string;
  linkedinLink?: string;
  githubLink?: string;
  avatarUrl?: string;
}

const InternProfileView: React.FC = () => {
  const [profile, setProfile] = useState<InternProfile>({});
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get<InternProfile>('/interns/profile');
      
      setProfile({
        ...res.data,
        avatarUrl: res.data.avatarUrl
          ? `${res.data.avatarUrl.split('?')[0]}?t=${Date.now()}`
          : undefined,
      });
      console.log("Avatar URL from API:", res.data.avatarUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
const API_BASE = 'http://localhost:3000';
  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

 return (
  <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
    {/* Title  */}
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-medium text-[#243874]">Thông tin cá nhân</h1>
      <button
        onClick={() => setOpenEdit(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Edit
      </button>
    </div>

    {/* Card trắng chứa ảnh + form */}
    <div className="bg-white shadow-lg rounded-lg w-full p-6">
      {/* Avatar căn giữa */}
      <div className="flex justify-center mb-6">
        
<img
  src={
    profile.avatarUrl
      ? `${API_BASE}${profile.avatarUrl}?t=${Date.now()}`
      : '/default.png'
  }
  alt="Avatar"
  className="w-32 h-32 rounded-full object-cover border"
/>
      </div>

      {/* Form */}
      <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Họ tên', value: profile.name },
          { label: 'Trường học', value: profile.school },
          { label: 'Chuyên ngành', value: profile.major },
          { label: 'Số điện thoại', value: profile.phone },
          { label: 'LinkedIn', value: profile.linkedinLink },
          { label: 'GitHub', value: profile.githubLink },
        ].map(({ label, value }, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              readOnly
              value={value || ''}
              className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 outline-none"
            />
          </div>
        ))}
      </form>
    </div>

    {/* Modal chỉnh sửa */}
    <InternProfileModal
      open={openEdit}
      onClose={() => setOpenEdit(false)}
      profile={profile}
      onUpdated={fetchProfile}
    />
  </div>
);

};

export default InternProfileView;
