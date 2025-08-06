import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface DocumentFile {
  id?: number;
  fileUrl: string;
  type: "image" | "video" | "file";
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  type: "image" | "video" | "file";
  status: string;
  files: DocumentFile[];
}

interface Props {
  open: boolean;
  document: Document | null;
  onClose: () => void;
}

export default function DocumentViewerDialog({ open, document, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{document?.title}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: "80vh" }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {document?.description}
        </Typography>

        {document?.files?.map((file, idx) => {
          const filePath = `http://localhost:3000/${file.fileUrl}`;
          if (file.type === "image") {
            return (
              <img
                key={idx}
                src={filePath}
                alt={`${document?.title} - ${idx}`}
                style={{ width: "100%", borderRadius: 4, marginBottom: 8 }}
              />
            );
          }
          if (file.type === "video") {
            return (
              <video
                key={idx}
                controls
                style={{ width: "100%", borderRadius: 4, marginBottom: 8 }}
              >
                <source src={filePath} />
              </video>
            );
          }
          return (
            <Button
              key={idx}
              href={filePath}
              download
              sx={{ mb: 1 }}
              variant="outlined"
            >
              Tải file {idx + 1}
            </Button>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
