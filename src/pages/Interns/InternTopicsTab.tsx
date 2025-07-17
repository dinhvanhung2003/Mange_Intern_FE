import { useEffect, useState } from "react";
import api from "@/utils/axios";
import { jwtDecode } from "jwt-decode";
interface Task {
  id: number;
  title: string;
}
interface Topic {
  id: number;
  title: string;
  description?: string;
  task?: Task[]; 
}

interface Deadline {
  id: number;
  requirement: string;
  deadline: string;
  submissionText?: string;
  submissionFileUrl?: string;
  submittedAt?: string;
  fileUrl?: string;
}


export default function InternTopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [deadlines, setDeadlines] = useState<Record<number, Deadline[]>>({});
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);

  const handleExpandTopic = async (topicId: number) => {
    try {
      // Gọi deadline
      const resDeadlines = await api.get(`/topics/${topicId}/deadlines`);
      setDeadlines(prev => ({ ...prev, [topicId]: resDeadlines.data }));

      // Gọi chi tiết topic (có task)
      const resTopicDetail = await api.get(`/topics/${topicId}`);
      const topicWithTasks = resTopicDetail.data;

      // Cập nhật tasks vào state topics
      setTopics(prev =>
        prev.map(topic =>
          topic.id === topicId ? { ...topic, tasks: topicWithTasks.tasks } : topic
        )
      );

      setExpandedTopicId(topicId);
    } catch {
      alert("Không thể tải thông tin topic hoặc deadline.");
    }
  };


  interface JwtPayload {
    sub: number;
  }

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
      alert("Không tìm thấy token");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const internId = decoded.sub;

      api.get(`/topics/by-intern/${internId}`)
        .then(res => setTopics(res.data))
        .catch(() => alert("Không thể tải đề tài"));
    } catch (error) {
      alert("Token không hợp lệ");
    }
  }, []);


  const fetchDeadlines = async (topicId: number) => {
    try {
      const res = await api.get(`/topics/${topicId}/deadlines`);
      setDeadlines(prev => ({ ...prev, [topicId]: res.data }));
      setExpandedTopicId(topicId);
    } catch {
      alert("Không thể tải deadline");
    }
  };

  const handleSubmitDeadline = async (deadlineId: number) => {
    alert(`TODO: Nộp deadline ${deadlineId}`);

  };

  const getCountdown = (deadline: string): { text: string; isLate: boolean } => {
    const now = Date.now();
    const target = new Date(deadline).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { text: "Trễ hạn", isLate: true };
    }

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      text: `${hours}h ${minutes}m ${seconds}s`,
      isLate: false,
    };
  };
  const renderCountdown = (dlId: number) => {
    const countdown = countdowns[dlId];
    if (!countdown) return null;

    return (
      <span className={countdown.isLate ? "text-red-600 font-bold" : "text-green-600 font-semibold"}>
        {countdown.text}
      </span>
    );
  };

  const [countdowns, setCountdowns] = useState<Record<number, { text: string; isLate: boolean }>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: Record<number, { text: string; isLate: boolean }> = {};

      Object.values(deadlines).forEach((dls) => {
        dls.forEach((dl) => {
          updates[dl.id] = getCountdown(dl.deadline);
        });
      });

      setCountdowns(updates);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlines]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Đề tài được giao</h2>

      {topics.length === 0 ? (
        <p className="text-gray-500 italic">Bạn chưa có đề tài nào.</p>
      ) : (
        topics.map(topic => (
          <div key={topic.id} className="border p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{topic.title}</h3>
                {topic.description && (
                  <p className="text-sm text-gray-700">{topic.description}</p>
                )}
              </div>
              <button
                onClick={() =>
                  expandedTopicId === topic.id
                    ? setExpandedTopicId(null)
                    : handleExpandTopic(topic.id)
                }
                className="text-sm text-blue-600 underline"
              >
                {expandedTopicId === topic.id ? "Ẩn deadline" : "Xem deadline"}
              </button>

            </div>

            {expandedTopicId === topic.id && (
              <div className="mt-3 space-y-3">
                {deadlines[topic.id]?.length ? (
                  deadlines[topic.id].map(dl => (
                    <div key={dl.id} className="border rounded p-3">
                      <p><b>Yêu cầu:</b> {dl.requirement}</p>
         {dl.fileUrl && (
  <p>
    <b>File yêu cầu:</b>{' '}
    <a
      href={`http://localhost:3000/${dl.fileUrl}`} 
      download
      className="text-blue-600 underline"
    >
      Tải file
    </a>
  </p>
)}


                      <p><b>Hạn:</b> {new Date(dl.deadline).toLocaleString()}</p>
                      <p><b>Thời gian còn lại:</b> {renderCountdown(dl.id)}</p>

                     {dl.submissionText || dl.submissionFileUrl ? (
  <div className="mt-2 text-sm text-green-700">
    <p><b>Đã nộp:</b> {new Date(dl.submittedAt!).toLocaleString()}</p>
    {dl.submissionText && <p><b>Nội dung:</b> {dl.submissionText}</p>}
    {dl.submissionFileUrl && (
      <p>
        <a href={`/${dl.submissionFileUrl}`} target="_blank" className="text-blue-600 underline">
          Xem file đã nộp
        </a>
      </p>
    )}
  </div>
) : !countdowns[dl.id]?.isLate && (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      try {
        await api.post(`/topics/deadlines/${dl.id}/submit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Nộp bài thành công!");
        fetchDeadlines(topic.id); // reload deadline sau khi nộp
      } catch {
        alert("Lỗi khi nộp bài");
      }
    }}
    className="mt-2 space-y-2"
  >
    <textarea name="submissionText" placeholder="Nhập nội dung..." required className="border w-full p-2 rounded text-sm" />
    <input type="file" name="file" className="block text-sm" />
    <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
      Gửi bài
    </button>
  </form>
)}

                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-500">Chưa có deadline nào.</p>
                )}
              </div>
            )}
            {topic.task?.length ? (
  <div className="mt-4 pl-4 border-l-2 border-gray-200">
    <p className="text-sm font-semibold mb-1">Danh sách task:</p>
    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
      {topic.task.map((task: any) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  </div>
) : (
  <p className="text-sm italic text-gray-500 mt-2">Chưa có task nào cho topic này.</p>
)}

          </div>
        ))
      )}

    </div>
  );
}
