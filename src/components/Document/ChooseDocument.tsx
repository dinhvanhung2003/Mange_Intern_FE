import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Checkbox,
  ListItemButton,
} from "@mui/material";
import DocumentViewerDialog, { Document } from "./DocumentViewer";

interface DocumentSelectorDialogProps {
  documents: Document[];
  selectedDocIds: number[];
  onChange: (ids: number[]) => void;
  status: string; 
}

export default function DocumentSelectorDialog({
  documents,
  selectedDocIds,
  onChange,
}: DocumentSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<number[]>(selectedDocIds);
  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setTempSelected(selectedDocIds);
  }, [selectedDocIds]);

  const handleConfirm = () => {
    onChange(tempSelected);
    setOpen(false);
  };

  // Lọc tài liệu theo từ khóa
  const filteredDocuments = documents
  .filter((doc) => doc.status === "approved") 
  .filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Chọn tài liệu liên quan ({selectedDocIds.length})
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chọn tài liệu liên quan</DialogTitle>
        <DialogContent>
          {/* Ô tìm kiếm */}
          <TextField
            fullWidth
            label="Tìm kiếm tài liệu"
            variant="outlined"
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Bạn có thể chọn nhiều tài liệu
          </Typography>

          {/* Danh sách tài liệu */}
          {filteredDocuments.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Không tìm thấy tài liệu
            </Typography>
          ) : (
            <List dense>
             {filteredDocuments.map((doc) => (
  <ListItem
    key={doc.id}
    secondaryAction={
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setReviewDoc(doc);
        }}
      >
        Xem
      </Button>
    }
  >
    <ListItemButton onClick={() => toggleSelect(doc.id)}>
      <Checkbox checked={tempSelected.includes(doc.id)} />
      <ListItemText primary={doc.title} />
    </ListItemButton>
  </ListItem>
))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog review tài liệu */}
      <DocumentViewerDialog
        open={!!reviewDoc}
        document={reviewDoc}
        onClose={() => setReviewDoc(null)}
      />
    </>
  );
}
