import { useEffect, useState } from "react";
import api from "../../utils/axios";
import edit from "../../assets/edit.png";
import InternForm from "../Interns/InternForm";

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
  bio?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users"); 
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi khi tải users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .slice()
    .sort((a, b) => a.id - b.id)
    .filter((u) =>
      `${u.name}${u.email}${u.id}`.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-6 bg-white rounded shadow relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">User Management (Admin)</h2>
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
            + New User
          </button>
        </div>
      </div>

      {loading ? (
        <p>Đang tải danh sách users...</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">ID</th>
                <th className="border px-3 py-2 text-left">User</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">Type</th>
                <th className="border px-3 py-2 text-left">Bio</th>
                <th className="border px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{user.id}</td>
                  <td className="border px-3 py-2">{user.name}</td>
                  <td className="border px-3 py-2">{user.email}</td>
                  <td className="border px-3 py-2">{user.type}</td>
                  <td className="border px-3 py-2">{user.bio || "—"}</td>
                  <td className="border px-3 py-2 text-center space-x-3">
                    <button
                      className="hover:scale-110 transition"
                      onClick={() => {
                        setEditingUser(user);
                        setShowForm(true);
                      }}
                    >
                      <img src={edit} alt="Edit" className="w-5 h-5 inline-block" />
                    </button>
                    <button
                      className="text-red-600 text-sm hover:underline"
                      onClick={async () => {
                        const confirmed = window.confirm(`Xoá user "${user.name}"?`);
                        if (!confirmed) return;

                        try {
                          await api.delete(`/users/${user.id}`);
                          fetchUsers();
                        } catch (err) {
                          console.error("Lỗi khi xóa user:", err);
                          alert("Xóa thất bại.");
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <InternForm
          initialData={
            editingUser
              ? {
                  name: editingUser.name,
                  email: editingUser.email,
                  bio: editingUser.bio,
                }
              : undefined
          }
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSubmit={(data) => {
            const request = editingUser
              ? api.put(`/users/${editingUser.id}`, data)
              : api.post("/users", data);

            request.then(() => {
              fetchUsers();
              setShowForm(false);
              setEditingUser(null);
            });
          }}
        />
      )}
    </div>
  );
}
