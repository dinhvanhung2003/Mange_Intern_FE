import { useState, useEffect } from "react";

export default function UserForm({
  onClose,
  onSubmit,
  initialData,
  type = "intern",
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: {
    name: string;
    email: string;
    bio?: string;
    school?: string;
    major?: string;
    phone?: string;
    linkedinLink?: string;
    expertise?: string;
  };
  type?: "intern" | "mentor";
}) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    bio: string;
    password?: string;
    school?: string;
    major?: string;
    phone?: string;
    linkedinLink?: string;
    expertise?: string;
  }>({
    name: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        bio: initialData.bio || "",
        school: initialData.school || "",
        major: initialData.major || "",
        phone: initialData.phone || "",
        linkedinLink: initialData.linkedinLink || "",
        expertise: initialData.expertise || "",
        password: "", 
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || (!initialData && !form.password)) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    const dataToSubmit = { ...form };
    if (initialData) {
      delete dataToSubmit.password;
    }

    onSubmit(dataToSubmit);
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white z-50 shadow-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-blue-900">
          {initialData
            ? `Edit ${type === "intern" ? "Intern" : "Mentor"}`
            : `Add New ${type === "intern" ? "Intern" : "Mentor"}`}
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

        {!initialData && (
          <div>
            <label htmlFor="password" className="text-sm text-gray-700 mb-1 block">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="border p-2 rounded w-full outline-none"
            />
          </div>
        )}

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

        {type === "intern" && (
          <>
            <div>
              <label htmlFor="school" className="text-sm text-gray-700 mb-1 block">
                School
              </label>
              <input
                id="school"
                name="school"
                value={form.school || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full outline-none"
              />
            </div>

            <div>
              <label htmlFor="major" className="text-sm text-gray-700 mb-1 block">
                Major
              </label>
              <input
                id="major"
                name="major"
                value={form.major || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full outline-none"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm text-gray-700 mb-1 block">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full outline-none"
              />
            </div>

            <div>
              <label htmlFor="linkedinLink" className="text-sm text-gray-700 mb-1 block">
                LinkedIn
              </label>
              <input
                id="linkedinLink"
                name="linkedinLink"
                value={form.linkedinLink || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full outline-none"
              />
            </div>
          </>
        )}

        {type === "mentor" && (
          <div>
            <label htmlFor="expertise" className="text-sm text-gray-700 mb-1 block">
              Expertise
            </label>
            <input
              id="expertise"
              name="expertise"
              value={form.expertise || ""}
              onChange={handleChange}
              className="border p-2 rounded w-full outline-none"
            />
          </div>
        )}
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
