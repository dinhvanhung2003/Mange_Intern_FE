import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItemText,
  ListItem,
  ListItemButton,
  Button,
  Pagination
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios'; 
 import { useOutletContext } from 'react-router-dom';

interface AssignInternDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  onAssigned: () => void; // callback khi giao thành công
}
type ContextType = { showSnackbar: (message: string, severity?: "success" | "error" | "info" | "warning") => void };
export default function AssignInternDialog({ open, onClose, taskId, onAssigned }: AssignInternDialogProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedIntern, setSelectedIntern] = useState<any>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: internsData = [] } = useQuery({
  queryKey: ['mentorInterns', debouncedSearch, page],
  queryFn: () =>
    api.get('/mentor/interns', {
      params: { search: debouncedSearch, page, limit },
    }).then(res => res.data),
  enabled: open,
});
console.log(internsData);

const { showSnackbar } = useOutletContext<ContextType>();


  const handleAssign = async () => {
  if (!selectedIntern || !taskId) return;
  try {
    await api.patch(`/mentor/tasks/${taskId}/assign`, {
      internId: selectedIntern.id,
    });
    showSnackbar(`Giao task thành công cho ${selectedIntern.name}`, "success");
    onAssigned();
    onClose();
  } catch (err) {
    console.error(err);
    showSnackbar("Giao task thất bại!", "error");
  }
};


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chọn Intern để giao task</DialogTitle>
      <DialogContent>
        <TextField
          label="Tìm kiếm intern"
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />

      <List>
  {internsData.map((intern: any) => (
    <ListItem key={intern.id} disablePadding>
      <ListItemButton
        selected={selectedIntern?.id === intern.id}
        onClick={() => setSelectedIntern(intern)}
      >
        <ListItemText primary={intern.name} secondary={intern.email} />
      </ListItemButton>
    </ListItem>
  ))}
</List>


        <Pagination
          count={internsData.totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedIntern}
          onClick={handleAssign}
        >
          Giao task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
