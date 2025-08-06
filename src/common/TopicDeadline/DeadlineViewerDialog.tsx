import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/utils/axios";
import CountdownTimer from "@/components/Topics/CountDownTimer";

interface Topic {
  id: number;
  title: string;
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
interface Countdown {
  text: string;
  isLate: boolean;
}

interface Props {
  topic: Topic | null;
  onClose: () => void;
}

export default function DeadlineViewerDialog({ topic, onClose }: Props) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [countdowns, setCountdowns] = useState<Record<number, Countdown>>({});

  useEffect(() => {
    if (topic?.id) {
      api.get(`/topics/${topic.id}/deadlines`)
        .then(res => setDeadlines(res.data))
        .catch(() => alert("Không thể tải deadline"));
    }
  }, [topic]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updates: Record<number, Countdown> = {};

      deadlines.forEach(dl => {
        const target = new Date(dl.deadline).getTime();
        const diff = target - now;

        if (diff <= 0) {
          updates[dl.id] = { text: "Trễ hạn", isLate: true };
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          updates[dl.id] = {
            text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            isLate: false,
          };
        }
      });

      setCountdowns(updates);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlines]);

  const handleSubmitDeadline = async (
    e: React.FormEvent<HTMLFormElement>,
    deadlineId: number
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await api.post(`/topics/deadlines/${deadlineId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Nộp bài thành công!");
      const res = await api.get(`/topics/${topic!.id}/deadlines`);
      setDeadlines(res.data);
    } catch {
      alert("Lỗi khi nộp bài");
    }
  };

  return (
    <Dialog open={!!topic} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deadline của topic: {topic?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm max-h-[400px] overflow-y-auto">
          {deadlines.length === 0 ? (
            <p className="italic text-gray-500">Không có deadline.</p>
          ) : (
            deadlines.map(dl => (
              <div key={dl.id} className="border rounded p-3">
                <p><b>Yêu cầu:</b> {dl.requirement}</p>
                {dl.fileUrl && (
                  <p><b>File yêu cầu:</b>{" "}
                    <a href={dl.fileUrl} download className="text-blue-600 underline">Tải file</a>
                  </p>
                )}
                <p><b>Hạn:</b> {new Date(dl.deadline).toLocaleString()}</p>
               <p>
  <b>Thời gian còn lại:</b> <CountdownTimer deadline={dl.deadline} />
</p>

                {dl.submissionText || dl.submissionFileUrl ? (
                  <div className="mt-2 text-green-700">
                    <p><b>Đã nộp:</b> {new Date(dl.submittedAt!).toLocaleString()}</p>
                    {dl.submissionText && <p><b>Nội dung:</b> {dl.submissionText}</p>}
                    {dl.submissionFileUrl && (
                      <a
                        href={`/${dl.submissionFileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline block"
                      >
                        Xem file đã nộp
                      </a>
                    )}
                  </div>
                ) : !countdowns[dl.id]?.isLate && (
                  <form onSubmit={(e) => handleSubmitDeadline(e, dl.id)} className="mt-3 space-y-2">
                    <textarea
                      name="submissionText"
                      placeholder="Nhập nội dung..."
                      required
                      className="border w-full p-2 rounded text-sm"
                    />
                    <input type="file" name="file" className="block text-sm" />
                    <Button type="submit">Gửi bài</Button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
