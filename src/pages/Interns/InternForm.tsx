import { useState } from "react";
import avatar from "../../assets/avatar_add_intern.png"
export default function AddInternDrawer({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    location: "",
    email: "",
    bio: "",
    jobType: "",
    designation: "",
    manager: "",
    role: "intern",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white z-50 shadow-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-blue-900">Add New User</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="flex items-center mb-4 gap-4">
        <img
          src={avatar}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <button className="text-sm bg-gray-100 px-3 py-1 rounded border border-gray-300">
            Upload New Photo
          </button>
          <p className="text-xs mt-1 text-gray-500 w-[200px]">At least 150x150 px recommended JPG, PNG or JPEG is allowed</p>
        </div>
      </div>


      <p className="font-semibold text-gray-800 mb-2">Basic Info</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="text-sm text-gray-700 mb-1 block">
            First Name *
          </label>
          <input
            id="firstName"
            name="firstName"
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="text-sm text-gray-700 mb-1 block">
            Last Name *
          </label>
          <input
            id="lastName"
            name="lastName"
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm text-gray-700 mb-1 block">
            WhatsApp No. *
          </label>
          <input
            id="phone"
            name="phone"
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm text-gray-700 mb-1 block">
            Password *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="location" className="text-sm text-gray-700 mb-1 block">
            Location
          </label>
          <input
            id="location"
            name="location"
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
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
            className="border border-gray-300 p-2 rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="bio" className="text-sm text-gray-700 mb-1 block">
            Profile Summary *
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            className="border border-gray-300 p-2 rounded w-full outline-none resize-none focus:ring-1 focus:ring-blue-500"
            onChange={handleChange}
          />
        </div>
      </div>

      <p className="font-semibold text-gray-800 mt-4 mb-2">Professional Info</p>

      <div className="grid grid-cols-2 gap-2">
        <select name="jobType" className="border p-2 rounded" onChange={handleChange}>
          <option value="">Job Type *</option>
          <option value="internship">Internship</option>
          <option value="full-time">Full-Time</option>
        </select>
        <input name="designation" placeholder="Designation *" className="border p-2 rounded" onChange={handleChange} />
        <input name="manager" placeholder="Reporting Manager *" className="border p-2 rounded" onChange={handleChange} />
        <select
          name="role"
          className="border p-2 rounded"
          value="intern"
          disabled
        >
          <option value="intern">Intern</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-900 text-white w-full py-2 rounded hover:bg-blue-800"
      >
        Submit
      </button>
    </div>
  );
}
