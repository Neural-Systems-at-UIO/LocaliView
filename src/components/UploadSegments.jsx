import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { uploadToSegments } from "../actions/handleCollabs";
import UploadZone from "./UploadZone";

const UploadSegments = () => {
  const [segments, setSegments] = useState([]);
  const [title, setTitle] = useState("");

  const handleUpload = async () => {
    if (!title || !segments.length) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    segments.forEach((segment) => {
      formData.append("segments", segment);
    });

    await uploadToSegments(formData);
  };

  return (
    <Dialog>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Upload Segments
      </Typography>
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <UploadZone files={segments} setFiles={setSegments} />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        sx={{ mt: 2 }}
      >
        Upload
      </Button>

      <DialogActions>
        <Button onClick={() => {}}>Cancel</Button>
        <Button onClick={handleUpload}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadSegments;
