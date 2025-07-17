import React, { useEffect, useRef, useState } from "react";
import api from "../../utils/axios";
import Toast from "../../components/Toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import CreateDeadlineForm from "./CreateDeadlineForm"
interface Intern {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
}

interface Topic {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  tasks?: Task[];
}


interface Props {
  intern: Intern;
  open: boolean;
  onClose: () => void;
}

export default function InternTopicManager({ intern, open, onClose }: Props) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);


  // chọn topic nào 
  const [selectedTopicIdForAssign, setSelectedTopicIdForAssign] = useState<number | null>(null);
  const [currentAssignTopicId, setCurrentAssignTopicId] = useState<number | null>(null);
const [showAssignDialog, setShowAssignDialog] = useState(false);

// chọn deadline 
const [showCreateDeadlineDialog, setShowCreateDeadlineDialog] = useState(false);
const [currentDeadlineTopicId, setCurrentDeadlineTopicId] = useState<number | null>(null);



  //xem deadline 
  const [deadlines, setDeadlines] = useState([]);
const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
const [currentDeadlineTopic, setCurrentDeadlineTopic] = useState<Topic | null>(null);

const fetchDeadlines = async (topicId: number) => {
  try {
    const res = await api.get(`/topics/${topicId}/deadlines`);
    setDeadlines(res.data);
  } catch {
    alert("Không thể tải deadline.");
  }
};

const getCountdown = (deadline: string): { text: string; isLate: boolean } => {
  const target = new Date(deadline).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) return { text: "Trễ hạn", isLate: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    isLate: false,
  };
};

const [countdowns, setCountdowns] = useState<Record<number, { text: string; isLate: boolean }>>({});

useEffect(() => {
  if (!deadlines.length) return;

  const interval = setInterval(() => {
    const updated: Record<number, { text: string; isLate: boolean }> = {};
    deadlines.forEach((dl: any) => {
      updated[dl.id] = getCountdown(dl.deadline);
    });
    setCountdowns(updated);
  }, 1000);

  return () => clearInterval(interval);
}, [deadlines]);



  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  const fetchTopics = async () => {
    try {
      const res = await api.get(`/topics/by-intern/${intern.id}`);
      setTopics(res.data);
    } catch {
      triggerToast("Không thể tải topic.");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/mentor/interns/${intern.id}/tasks`);
      setTasks(res.data);
    } catch {
      triggerToast("Không thể tải task.");
    }
  };

  const handleCreateTopic = async () => {
    const title = titleRef.current?.value;
    const description = descRef.current?.value;
    const dueDate = dateRef.current?.value;

    if (!title || !dueDate) {
      triggerToast("Vui lòng nhập tiêu đề và hạn.");
      return;
    }

    try {
      await api.post("/topics", {
        title,
        description,
        dueDate,
        assignedToId: intern.id,
        createdById: 1, // TODO: lấy từ auth
      });
      triggerToast("Tạo topic thành công!");
      titleRef.current!.value = "";
      descRef.current!.value = "";
      dateRef.current!.value = "";
      fetchTopics();
    } catch {
      triggerToast("Tạo topic thất bại.");
    }
  };

  const toggleTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

 const handleAssignTasks = async () => {
  if (!selectedTopicIdForAssign) return triggerToast("Vui lòng chọn topic.");
  if (selectedTaskIds.length === 0) return triggerToast("Vui lòng chọn ít nhất một task.");

  try {
    await api.post("/topics/assign-tasks", {
      topicId: selectedTopicIdForAssign,
      taskIds: selectedTaskIds,
    });
    triggerToast("Đã giao task vào topic!");
    setSelectedTaskIds([]);
    setSelectedTopicIdForAssign(null);
    fetchTasks();
  } catch {
    triggerToast("Lỗi khi giao task.");
  }
};

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const fetchTopicDetail = async (topicId: number) => {
    try {
      const res = await api.get(`/topics/${topicId}`);
      setSelectedTopic(res.data);
    } catch {
      triggerToast("Không thể tải chi tiết topic.");
    }
  };
  const [showTopicDialog, setShowTopicDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTopics();
      fetchTasks();
    }
  }, [open]);

  if (!open) return null;

  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-3xl shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Topic của Intern: {intern.name}</h3>
          <button
            className="text-sm text-gray-500 hover:underline"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        <input ref={titleRef} placeholder="Tiêu đề" className="border w-full rounded p-2 mb-2" />
        <textarea ref={descRef} placeholder="Mô tả" className="border w-full rounded p-2 mb-2" />
        <input ref={dateRef} type="date" className="border w-full rounded p-2 mb-2" />
        <Button onClick={handleCreateTopic}>+ Tạo Topic</Button>

        <h4 className="text-md font-semibold mt-6 mb-2">Danh sách Topic</h4>
        <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Tiêu đề</th>
              <th className="border p-2">Mô tả</th>
              <th className="border p-2">Hạn</th>
                <th className="border p-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id}>
                <td className="border p-2">{topic.title}</td>
                <td className="border p-2">{topic.description || "-"}</td>
                <td className="border p-2">{topic.dueDate}</td>
              <td className="border p-2">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem
        onClick={() => {
          fetchTopicDetail(topic.id);
          setShowTopicDialog(true);
        }}
      >
        Xem Task
      </DropdownMenuItem>
     <DropdownMenuItem
  onClick={() => {
    setCurrentDeadlineTopicId(topic.id);
    setShowCreateDeadlineDialog(true);
  }}
>
   Tạo Deadline
</DropdownMenuItem>


      <DropdownMenuItem
        onClick={() => {
          fetchDeadlines(topic.id);
          setCurrentDeadlineTopic(topic);
          setShowDeadlineDialog(true);
        }}
      >
        Xem Deadline
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          setCurrentAssignTopicId(topic.id);
          setShowAssignDialog(true);
        }}
      >
        Giao Task
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>



              </tr>
            ))}
          </tbody>
        </table>


        {/* <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-6">+ Giao Task vào Topic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className="mb-4">
  <label className="text-sm font-medium">Chọn Topic:</label>
  <select
    className="w-full border p-2 rounded"
    value={selectedTopicIdForAssign ?? ""}
    onChange={(e) => setSelectedTopicIdForAssign(Number(e.target.value))}
  >
    <option value="" disabled>-- Chọn topic --</option>
    {topics.map((topic) => (
      <option key={topic.id} value={topic.id}>{topic.title}</option>
    ))}
  </select>
</div>

              <DialogTitle>Chọn Task để gán vào Topic</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 max-h-64 overflow-y-auto border p-2 rounded">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <span className="text-sm">{task.title}</span>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={handleAssignTasks}>Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
<Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Chọn Task để giao vào Topic</DialogTitle>
    </DialogHeader>

    <div className="space-y-2 max-h-64 overflow-y-auto border p-2 rounded">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center space-x-2">
          <Checkbox
            checked={selectedTaskIds.includes(task.id)}
            onCheckedChange={() => toggleTask(task.id)}
          />
          <span className="text-sm">{task.title}</span>
        </div>
      ))}
    </div>

    <DialogFooter>
      <Button
        onClick={async () => {
          if (!currentAssignTopicId) return triggerToast("Chưa chọn topic.");
          if (!selectedTaskIds.length) return triggerToast("Chưa chọn task.");
          try {
            await api.post("/topics/assign-tasks", {
              topicId: currentAssignTopicId,
              taskIds: selectedTaskIds,
            });
            triggerToast("Đã giao task!");
            setSelectedTaskIds([]);
            setShowAssignDialog(false);
            fetchTasks();
          } catch {
            triggerToast("Giao task thất bại.");
          }
        }}
      >
        Xác nhận
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        <Toast
          message={toastMessage}
          show={isToastVisible}
          onClose={() => setIsToastVisible(false)}
        />
      </div>
      {selectedTopic && (
        <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Task thuộc Topic: {selectedTopic?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-64 overflow-y-auto text-sm">
              {selectedTopic?.tasks?.length ? (
                <ul className="list-disc pl-4">
                  {selectedTopic.tasks.map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Không có task nào trong topic này.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTopicDialog(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      )}
{currentDeadlineTopic && (
  <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Deadline của Topic: {currentDeadlineTopic.title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 max-h-64 overflow-y-auto text-sm">
        {deadlines.length > 0 ? (
          deadlines.map((dl: any) => (
            <div key={dl.id} className="border p-2 rounded">
              <p><b>Yêu cầu:</b> {dl.requirement}</p>
              <p><b>Hạn nộp:</b> {new Date(dl.deadline).toLocaleString()}</p>
              {dl.submissionText || dl.submissionFileUrl ? (
  <div className="mt-2 text-sm text-green-700">
    <p><b>Intern đã nộp lúc:</b> {new Date(dl.submittedAt!).toLocaleString()}</p>
    {dl.submissionText && <p><b>Nội dung:</b> {dl.submissionText}</p>}
    {dl.submissionFileUrl && (
      <p>
       <a
  href={`http://localhost:3000/${dl.submissionFileUrl}`}
  download
  target="_blank"
  className="text-blue-600 underline"
>
  Xem file đã nộp
</a>

      </p>
    )}
  </div>
) : (
  <p className="text-sm italic text-gray-500 mt-1">Intern chưa nộp bài.</p>
)}

               <p
      className={`font-semibold ${
        countdowns[dl.id]?.isLate ? "text-red-600" : "text-green-600"
      }`}
    >
      {countdowns[dl.id]?.text}
    </p>
              {dl.fileUrl && (
                <a href={dl.fileUrl} target="_blank" className="text-blue-600 underline">
                  Xem file
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Chưa có deadline nào.</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setShowDeadlineDialog(false)}>
          Đóng
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
<Dialog open={showCreateDeadlineDialog} onOpenChange={setShowCreateDeadlineDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Tạo Deadline</DialogTitle>
    </DialogHeader>
    {currentDeadlineTopicId && (
      <CreateDeadlineForm topicId={currentDeadlineTopicId} />
    )}
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowCreateDeadlineDialog(false)}>
        Đóng
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}
