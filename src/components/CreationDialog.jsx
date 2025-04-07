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
  project,
  token,
  brainEntries,
  onUploadComplete,
}) {
  const [name, setName] = useState("");
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [editBrainsList, setEditBrainsList] = useState([]);
  // Message to inform user
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

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes fully otherwise stuck with the old uploads
      setFilesToUpload([]);
      setName("");
      setUploadProgress(0);
    }
  }, [open]);

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
        let completedUploads = 0;

        // All the files in the array
        const uploadPromises = filesToUpload.map(async (file) => {
          const result = await uploadToPath(
            token,
            collabName,
            project.name,
            name + "/raw_images/",
            file
          );
          // This might appear jagged
          completedUploads++;
          setUploadProgress((completedUploads / filesToUpload.length) * 100);

          return { ...result, originalFile: file };
        });

        // Wait for all uploads to complete in parallel
        const uploadedFiles = await Promise.all(uploadPromises);

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
    if (!name || name.trim() === "") {
      setInfoMessage({
        open: true,
        message: "An image series name is required",
        severity: "error",
      });
      alert("An image series name is required");
      return;
    }

    if (filesToUpload.length === 0) {
      setInfoMessage({
        open: true,
        message: "Please select files to upload",
        severity: "warning",
      });
      alert("Please select files to upload");
      return;
    }

    try {
      await uploadFiles();
      onUploadComplete?.();
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
          <Button onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
