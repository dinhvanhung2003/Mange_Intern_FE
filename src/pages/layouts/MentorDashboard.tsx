import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import api from "../../utils/axios";
import {CartesianGrid} from "recharts";

export default function MentorDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  // 1) Tổng quan
  const {
    data: stats = { mentors: 0, interns: 0, tasks: 0, topics: 0, completion: 0 },
    isLoading, error,
  } = useQuery({
    queryKey: ["mentorDashboardSummary"],
    queryFn: async () => (await api.get("/mentor/dashboard/summary")).data,
  });

  // 2) Intern statistics
  const { data: internStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ["internStats", selectedYear],
    queryFn: async () =>
      (await api.get("/mentor/dashboard/intern-statistics", { params: { year: selectedYear } })).data,
  });

  // 3) Topic task stats (cần trả { id, name, value })
  const { data: topicTaskStats = [] } = useQuery({
    queryKey: ["topicTaskStats"],
    queryFn: async () => (await api.get("/mentor/dashboard/topic-tasks")).data,
  });

  // Auto chọn topic đầu tiên khi có dữ liệu
  useEffect(() => {
    if (!selectedTopicId && topicTaskStats.length > 0) {
      setSelectedTopicId(topicTaskStats[0].id);
    }
  }, [topicTaskStats, selectedTopicId]);

  // 4) Rank theo topic (BE trả [{rank, internId, internName, taskId, score}])
  const { data: topicRank = [], isLoading: isLoadingRank } = useQuery({
    queryKey: ["topicRank", selectedTopicId],
    enabled: !!selectedTopicId,
    queryFn: async () =>
      (await api.get(`/mentor/dashboard/topics/${selectedTopicId}/rank`)).data,
  });

  const donutData = [
    { name: "Hoàn thành", value: stats.completion },
    { name: "Chưa", value: 100 - stats.completion },
  ];
  const donutColors = ["#3B82F6", "#E5E7EB"];

  // Lọc dữ liệu local theo năm/tháng
  const filteredData = useMemo(() => {
    return internStats.filter((item: any) => {
      const itemMonth = item.month ?? item.date?.slice(5, 7);
      const itemYear = item.date?.slice(0, 4) ?? String(selectedYear);
      const matchYear = itemYear === String(selectedYear);
      const matchMonth = selectedMonth ? itemMonth === selectedMonth : true;
      return matchYear && matchMonth;
    });
  }, [internStats, selectedYear, selectedMonth]);

  // Chuẩn bị dữ liệu chart
  const chartData = useMemo(() => {
    if (!selectedMonth) {
      return Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        const count = filteredData
          .filter((it: any) => it.month === m)
          .reduce((sum: number, it: any) => sum + Number(it.count || 0), 0);
        return { month: m, interns: count };
      });
    }
    return filteredData.map((it: any) => ({ date: it.date, interns: Number(it.count || 0) }));
  }, [filteredData, selectedMonth]);

  if (isLoading || isLoadingStats) return <div className="p-6">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-6 text-red-500">Lỗi khi tải dữ liệu!</div>;

  return (
    <div className="p-6 bg-[#f7f9fc] min-h-screen text-[#1f2937]">
      <h1 className="text-2xl font-semibold mb-6">Dashboard Mentor</h1>

      {/* Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-sm text-gray-500">Tasks</p>
          <h2 className="text-2xl font-bold">{stats.tasks}</h2>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-sm text-gray-500">Interns</p>
          <h2 className="text-2xl font-bold">{stats.interns}</h2>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-sm text-gray-500">Topics</p>
          <h2 className="text-2xl font-bold">{stats.topics}</h2>
        </div>
        <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completion</p>
            <h2 className="text-2xl font-bold">{stats.completion}%</h2>
          </div>
          <PieChart width={60} height={60}>
            <Pie data={donutData} innerRadius={20} outerRadius={28} dataKey="value" stroke="none">
              {donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
            </Pie>
          </PieChart>
        </div>
      </div>

      {/* 2 cột: Bar trái, Pie + Rank phải */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart Interns */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Thống kê Interns</h2>
          <div className="flex gap-4 items-center mb-4">
            <select className="border p-2 rounded" value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2023, 2024, 2025].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="border p-2 rounded" value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => {
                const v = String(i + 1).padStart(2, "0");
                return <option key={v} value={v}>Tháng {v}</option>;
              })}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey={selectedMonth ? "date" : "month"} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="interns" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + Rank */}
        <div className="bg-white rounded-xl p-4 shadow flex flex-col">
            <div className="flex items-center justify-between mb-2">
    <h2 className="text-lg font-semibold">Task theo Topic</h2>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Xem rank topic:</span>
      <select
        className="border p-2 rounded"
        value={selectedTopicId ?? ""}
        onChange={(e) => setSelectedTopicId(Number(e.target.value))}
      >
        {topicTaskStats.map((t: any) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  </div>

  <ResponsiveContainer width="100%" height={250}>
    <BarChart
      data={[...topicTaskStats].sort((a: any, b: any) => b.value - a.value)}
      layout="vertical"
      margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis type="category" dataKey="name" width={120} />
      <Tooltip formatter={(v: number) => [`${v} task`, 'Số task']} />
      <Legend />
      <Bar dataKey="value" name="Số task" fill="#3B82F6" />
    </BarChart>
  </ResponsiveContainer>

          <h3 className="text-md font-semibold mt-4 mb-2">Bảng xếp hạng</h3>
          {isLoadingRank ? (
            <div className="text-sm text-gray-500">Đang tải bảng xếp hạng…</div>
          ) : topicRank.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có dữ liệu.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Hạng</th>
                    <th className="p-2 border">Intern</th>
                    <th className="p-2 border">Điểm task</th>
                  </tr>
                </thead>
                <tbody>
                  {topicRank.map((r: any) => (
                    <tr key={r.internId}>
                      <td className="p-2 border">{r.rank}</td>
                      <td className="p-2 border">{r.internName}</td>
                      <td className="p-2 border">{r.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
