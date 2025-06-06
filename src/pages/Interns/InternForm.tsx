import { useState, useEffect } from "react";

export default function InternForm({
  onClose,
  onSubmit,
  initialData,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: { name: string; email: string; bio?: string };
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        bio: initialData.bio || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      alert("Vui lòng điền đầy đủ họ tên và email.");
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white z-50 shadow-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-blue-900">
          {initialData ? "Edit Intern" : "Add New Intern"}
        </h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm text-gray-700 mb-1 block">
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded w-full outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm text-gray-700 mb-1 block">
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded w-full outline-none"
          />
        </div>

        <div>
          <label htmlFor="bio" className="text-sm text-gray-700 mb-1 block">
            Profile Summary
          </label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            className="border p-2 rounded w-full outline-none resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-900 text-white w-full py-2 rounded hover:bg-blue-800"
      >
        {initialData ? "Update" : "Submit"}
      </button>
    </div>
  );
}
