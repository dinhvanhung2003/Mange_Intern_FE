import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "../../utils/axios";

interface InternProfile {
  name?: string;
  school?: string;
  major?: string;
  phone?: string;
  linkedinLink?: string;
  githubLink?: string;
  avatarUrl?: string;
}

const InternProfileModal = ({
  open,
  onClose,
  profile,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  profile: InternProfile;
  onUpdated: () => void;
}) => {
  const [form, setForm] = useState<InternProfile>(profile);
  const [showToast, setShowToast] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatarUrl);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  try {
    // Nếu có avatar mới thì upload trước
    if (avatarFile) {
      const formData = new FormData();
      formData.append('file', avatarFile);

      await api.put('/interns/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

  
    await api.put('/interns/profile', form);

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onUpdated(); 
      onClose();
    }, 2000);
  } catch (err) {
    console.error('Lỗi cập nhật:', err);
  }
};


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-4 py-2 rounded shadow flex items-center justify-between min-w-[250px]">
          <span>Cập nhật thành công!</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-4 font-bold text-white"
          >
            ×
          </button>
        </div>
      )}

      <div className="w-full p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-semibold">Chỉnh sửa thông tin cá nhân</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            &times;
          </button>
        </div>
        <div className="col-span-full">
          <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              className="w-24 h-24 object-cover rounded-full border mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }
            }}
            className="block w-full"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded shadow"
        >
          {[
            { name: 'name', label: 'Họ tên' },
            { name: 'school', label: 'Trường học' },
            { name: 'major', label: 'Chuyên ngành' },
            { name: 'phone', label: 'Số điện thoại' },
            { name: 'linkedinLink', label: 'LinkedIn' },
            { name: 'githubLink', label: 'GitHub' },
          ].map(({ name, label }, i) => (
            <div key={i}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                name={name}
                value={form[name as keyof InternProfile] || ""}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          ))}

          <div className="col-span-full">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternProfileModal;
