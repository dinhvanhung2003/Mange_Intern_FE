import { useEffect, useState } from "react";
import api from "../../utils/axios";
import edit from "../../assets/edit.png";
import InternForm from "./InternForm";

interface Intern {
  id: number;
  email: string;
  name: string;
  role: string;
  bio?: string;
}

export default function InternManagement() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/interns");
      setInterns(res.data);
    } catch (err) {
      console.error("Lỗi khi tải interns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const filteredInterns = interns.filter((intern) =>
    `${intern.name}${intern.email}${intern.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded shadow relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">Intern User List</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by Text or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded outline-none w-full sm:w-auto"
          />
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            + New Intern
          </button>
        </div>
      </div>


      {/* Table */}
      {loading ? (
        <p>Đang tải danh sách interns...</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">ID</th>
                <th className="border px-3 py-2 text-left">User</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">Role</th>
                <th className="border px-3 py-2 text-left">Bio</th>
                <th className="border px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{intern.id}</td>
                  <td className="border px-3 py-2">{intern.name}</td>
                  <td className="border px-3 py-2">{intern.email}</td>
                  <td className="border px-3 py-2">{intern.role}</td>
                  <td className="border px-3 py-2">{intern.bio || "—"}</td>
                  <td className="border px-3 py-2 text-center">
                    <button className="hover:scale-110 transition">
                      <img src={edit} alt="Edit" className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in Form */}
      {showForm && (
        <InternForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => {
            api.post("/users", data).then(() => {
              fetchInterns();
              setShowForm(false);
            });
          }}
        />
      )}
    </div>
  );
}
