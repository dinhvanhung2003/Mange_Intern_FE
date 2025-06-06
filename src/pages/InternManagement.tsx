import { useEffect, useState } from "react";
import api from "../utils/axios";

interface Intern {
  id: number;
  email: string;
  bio?: string;
}

export default function InternManagement() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const res = await api.get("/users/interns");
        setInterns(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách interns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterns();
  }, []);

  if (loading) return <div>Đang tải danh sách interns...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Intern Management</h2>
      <ul className="space-y-2">
        {interns.map((intern) => (
          <li key={intern.id} className="p-3 bg-white rounded shadow">
            <p><strong>Email:</strong> {intern.email}</p>
            <p><strong>Bio:</strong> {intern.bio || "Không có"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
