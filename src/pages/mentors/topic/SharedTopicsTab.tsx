import { useEffect, useState } from 'react';
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import MuiButton from '@mui/material/Button';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import SharedTopicCreateDialog from "./SharedTopicCreateDialog";
import AssignTasksDialog from './AssignTaskToTopicDialog';
import DeadlineViewerDialog from '../../../common/TopicDeadline/DeadlineViewerDialog';
import CreateDeadlineForm from './CreateDeadlineForm';

interface Task {
  id: number;
  title: string;
  intern?: { id: number; name: string };
  deadline?: string;
  status?: string;
}

interface Topic {
  id: number;
  title: string;
  description?: string;
  tasks?: Task[];
}

export default function SharedTopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [assigningTopic, setAssigningTopic] = useState<Topic | null>(null);
  const [showCreateDeadline, setShowCreateDeadline] = useState(false);
  const [creatingTopicId, setCreatingTopicId] = useState<number | null>(null);

  const fetchSharedTopics = async () => {
    try {
      const res = await api.get(`/topics/shared`);
      setTopics(res.data);
      // console.log(res.data);
    } catch (err) {
      alert('Không thể tải topic chung');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSharedTopics();
  }, []);

  // const handleEditTask = (task: Task) => {
  //   console.log("Edit task", task);
  //   // mở dialog chỉnh sửa ở đây
  // };

  // const handleDeleteTask = async (taskId: number) => {
  //   if (confirm("Bạn có chắc muốn xóa task này?")) {
  //     try {
  //       await api.delete(`/tasks/${taskId}`);
  //       fetchSharedTopics();
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Đề tài dùng chung</h2>
      <MuiButton variant="contained" onClick={() => setShowCreate(true)}>Tạo Topic Dùng Chung</MuiButton>

      {topics.length === 0 ? (
        <p className="text-gray-500 italic">Chưa tạo đề tài chung nào.</p>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedTopic(topic)}>
                    Xem deadline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssigningTopic(topic)}>
                    Gán task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreatingTopicId(topic.id);
                      setShowCreateDeadline(true);
                    }}
                  >
                    Tạo deadline
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Danh sách task</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {topic.tasks?.length ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><b>Tên task</b></TableCell>
                          <TableCell><b>Intern</b></TableCell>
                        
                          <TableCell><b>Trạng thái</b></TableCell>
                       
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topic.tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>{task.title}</TableCell>
                            <TableCell>{task.intern?.name || "—"}</TableCell>
                          
                            <TableCell>{task.status || "Chưa cập nhật"}</TableCell>
                            
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <p className="text-sm italic text-gray-500">Chưa có task trong topic này.</p>
                )}
              </AccordionDetails>
            </Accordion>
          </div>
        ))
      )}

      <DeadlineViewerDialog
        topic={selectedTopic}
        onClose={() => setSelectedTopic(null)}
      />
      <SharedTopicCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchSharedTopics}
      />
      {assigningTopic && (
        <AssignTasksDialog
          topicId={assigningTopic.id}
          open={!!assigningTopic}
          onClose={() => setAssigningTopic(null)}
          onAssigned={fetchSharedTopics}
        />
      )}
      {showCreateDeadline && creatingTopicId && (
        <Dialog open={showCreateDeadline} onOpenChange={setShowCreateDeadline}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo deadline cho topic</DialogTitle>
            </DialogHeader>
            <CreateDeadlineForm topicId={creatingTopicId} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDeadline(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
