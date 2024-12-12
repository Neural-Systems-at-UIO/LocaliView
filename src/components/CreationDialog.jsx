import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Chip,
  Box,
  Alert,
  Autocomplete,
  LinearProgress,
} from "@mui/material";
import { uploadToPath } from "../actions/handleCollabs";
import UploadZone from "./UploadZone";

export default function CreationDialog({
  open,
  onClose,
  onSubmit,
  project,
  updateProjects,
  token,
  brainEntries,
}) {
  const [name, setName] = useState("");
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [editBrainsList, setEditBrainsList] = useState([]);

  const [infoMessage, setInfoMessage] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // For upload feedback of images to series
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (brainEntries) {
      const editBrains = brainEntries.map((entry) => entry.name);
      setEditBrainsList(editBrains);
      console.log(editBrains);
    }
  }, [brainEntries]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  // Allow user to unselect files
  const handleFilesSelected = (files) => {
    setFilesToUpload(files);
  };

  const uploadFiles = async () => {
    const collabName = localStorage.getItem("bucketName");
    setIsUploading(true);
    setUploadProgress(0);

    if (filesToUpload.length > 0) {
      try {
        const uploadedFiles = [];
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const result = await uploadToPath(
            token,
            collabName,
            project.name,
            name,
            file
          );
          uploadedFiles.push({ ...result, originalFile: file });
          setUploadProgress(((i + 1) / filesToUpload.length) * 100);
        }
        setIsUploading(false);
        setInfoMessage({
          open: true,
          message: "Files uploaded successfully",
          severity: "success",
        });
        return uploadedFiles;
      } catch (error) {
        setIsUploading(false);
        console.error("Error uploading files:", error);
        setInfoMessage({
          open: true,
          message: "Error uploading files",
          severity: "error",
        });
        throw error;
      }
    }
    setIsUploading(false);
    return [];
  };

  const handleSubmit = async () => {
    const collabName = localStorage.getItem("bucketName");
    try {
      const uploadedFiles = await uploadFiles();
      if (typeof onSubmit === "function") {
        onSubmit({ name, files: uploadedFiles });
      }
      updateProjects(collabName);
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <>
      <Snackbar
        open={infoMessage.open}
        autoHideDuration={6000}
        onClose={() => setInfoMessage({ ...infoMessage, open: false })}
      >
        <Alert
          onClose={() => setInfoMessage({ ...infoMessage, open: false })}
          severity={infoMessage.severity}
          sx={{ width: "100%" }}
        >
          {infoMessage.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { minHeight: "80vh" } }}
      >
        <DialogTitle>
          Upload an image series in {project?.name || ""}
        </DialogTitle>
        <DialogContent sx={{ padding: "20px" }}>
          <DialogContentText sx={{ marginBottom: "20px" }}>
            Enter the name of the series, or click on already created serie,
            upload files, choose and click submit.
          </DialogContentText>
          <Autocomplete
            freeSolo
            id="brain-name-combo"
            options={editBrainsList}
            value={name}
            onChange={(event, newValue) => {
              // Agnostic replace to handle both selection from dropdown and manual entry
              if (newValue) {
                handleNameChange({ target: { value: newValue } });
              }
            }}
            onInputChange={(event, newValue) => {
              handleNameChange({ target: { value: newValue } });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label="Name"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
              />
            )}
            sx={{
              "& .MuiAutocomplete-listbox": {
                "&::-webkit-scrollbar": {
                  height: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#bbb",
                  borderRadius: "4px",
                },
              },
            }}
          />

          <UploadZone onFilesSelected={handleFilesSelected} />
          {isUploading && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <DialogContentText>
                Uploading: {Math.round(uploadProgress)}%
              </DialogContentText>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "20px" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
