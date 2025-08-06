import { useEffect, useState } from "react";
import api from "@/utils/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
  assignedTo: {
    id: number;
    name: string;
    email: string;
  };
}


export default function AssignTasksDialog({
  topicId,
  open,
  onClose,
  onAssigned
}: {
  topicId: number;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

useEffect(() => {
  if (!open) return;
  api.get("/mentor/tasks/assigned-no-topic")
    .then(res => setTasks(res.data))
    .catch(() => alert("Không thể tải danh sách task"));
}, [open]);


  const toggleSelect = (taskId: number) => {
    setSelected(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const handleAssign = async () => {
    try {
      await api.post("/topics/assign-tasks", {
        topicId,
        taskIds: selected
      });
      onAssigned();
      onClose();
    } catch {
      alert("Không thể gán task vào topic");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn task để gán vào topic</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[300px] overflow-auto">
          {tasks.map(task => (
            <label key={task.id} className="block border p-2 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(task.id)}
                onChange={() => toggleSelect(task.id)}
              />{" "}
             {task.title} (của {task.assignedTo?.name})
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleAssign} disabled={selected.length === 0}>Gán</Button>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
