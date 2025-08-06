import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import authApi from "../../utils/axios";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,

} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CountdownTimer from "@/components/Topics/CountDownTimer";
interface Task {
  id: number;
  title: string;
}
interface Topic {
  id: number;
  title: string;
  description?: string;
  tasks?: Task[];
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

interface JwtPayload {
  sub: number;
}

export default function InternTopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [deadlines, setDeadlines] = useState<Record<number, Deadline[]>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [countdowns, setCountdowns] = useState<Record<number, { text: string; isLate: boolean }>>({});
useEffect(() => {
  authApi.get("/auth/me")
    .then(res => {
      const internId = res.data?.id;
      if (!internId) return alert("Không tìm thấy thông tin intern");

      const fetchPersonal = authApi.get(`/topics/by-intern/${internId}`);
      const fetchShared = authApi.get(`/topics/shared/interns/${internId}`);

      Promise.all([fetchPersonal, fetchShared])
        .then(([resPersonal, resShared]) => {
          console.log("Personal topics:", resPersonal.data);
          console.log("Shared topics:", resShared.data);

          const allTopics = [...resPersonal.data, ...resShared.data];
          console.log("All topics merged:", allTopics);

          setTopics(allTopics);
        })
        .catch((err) => {
          console.error("Error fetching topics:", err);
          alert("Không thể tải đề tài");
        });
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      alert("Không thể lấy thông tin người dùng");
    });
}, []);






 

  const openDeadlineDialog = async (topic: Topic) => {
    try {
      const res = await authApi.get(`/topics/${topic.id}/deadlines`);
      setDeadlines(prev => ({ ...prev, [topic.id]: res.data }));
      setSelectedTopic(topic);
    } catch {
      alert("Không thể tải deadline");
    }
  };

  const handleSubmitDeadline = async (e: React.FormEvent<HTMLFormElement>, topicId: number, deadlineId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await authApi.post(`/topics/deadlines/${deadlineId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert("Nộp bài thành công!");
      const res = await authApi.get(`/topics/${topicId}/deadlines`);
      setDeadlines(prev => ({ ...prev, [topicId]: res.data }));
    } catch {
      alert("Lỗi khi nộp bài");
    }
  };

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
                {topic.description && <p className="text-sm text-gray-700">{topic.description}</p>}
              </div>
              <Button variant="outline" onClick={() => openDeadlineDialog(topic)}>
                Xem deadline
              </Button>
            </div>

           {topic.tasks?.length ? (
  <div className="mt-4">
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          Danh sách task ({topic.tasks.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {topic.tasks.map(task => (
            <li key={task.id}>
              {task.title}
            </li>
          ))}
        </ul>
      </AccordionDetails>
    </Accordion>
  </div>
) : (
  <p className="text-sm italic text-gray-500 mt-2">
    Chưa có task nào cho topic này.
  </p>
)}
          </div>
        ))
      )}

      <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Deadline của topic: {selectedTopic?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm max-h-[400px] overflow-y-auto">
            {selectedTopic && deadlines[selectedTopic.id]?.length ? (
              deadlines[selectedTopic.id].map(dl => (
                <div key={dl.id} className="border rounded p-3">
                  <p><b>Yêu cầu:</b> {dl.requirement}</p>
                  {dl.fileUrl && (
                    <p><b>File yêu cầu:</b>{" "}
                      <a href={dl.fileUrl} download className="text-blue-600 underline">Tải file</a>
                    </p>
                  )}
                  <p><b>Hạn:</b> {new Date(dl.deadline).toLocaleString()}</p>
                 <p><b>Thời gian còn lại:</b> <CountdownTimer deadline={dl.deadline} /></p>


                  {dl.submissionText || dl.submissionFileUrl ? (
                    <div className="mt-2 text-green-700 text-sm">
                      <p><b>Đã nộp:</b> {new Date(dl.submittedAt!).toLocaleString()}</p>
                      {dl.submissionText && <p><b>Nội dung:</b> {dl.submissionText}</p>}
                      {dl.submissionFileUrl && (
                        <p><a href={`/${dl.submissionFileUrl}`} target="_blank" download className="text-blue-600 underline">Xem file đã nộp</a></p>
                      )}
                    </div>
                  ) : !countdowns[dl.id]?.isLate && (
                    <form onSubmit={(e) => handleSubmitDeadline(e, selectedTopic.id, dl.id)} className="mt-3 space-y-2">
                      <textarea name="submissionText" placeholder="Nhập nội dung..." required className="border w-full p-2 rounded text-sm" />
                      <input type="file" name="file" className="block text-sm" />
                      <Button type="submit">Gửi bài</Button>
                    </form>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm italic text-gray-500">Không có deadline.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTopic(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
