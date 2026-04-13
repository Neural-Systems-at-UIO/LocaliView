import logger from "../utils/logger.js";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Box,
  Autocomplete,
  LinearProgress,
  Chip,
  Typography,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import { uploadToPath, uploadToJson } from "../actions/handleCollabs";
import { useNotification } from "../contexts/NotificationContext";
import UploadZone from "./UploadZone";
import KGImportDialog from "./KGImportDialog";

export default function CreationDialog({
  open,
  onClose,
  project,
  token,
  brainEntries,
  onUploadComplete,
}) {
  const { showError, showWarning, showSuccess } = useNotification();
  const [name, setName] = useState("");
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [editBrainsList, setEditBrainsList] = useState([]);

  // For upload feedback of images to series
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // KG import mode
  const [kgDialogOpen, setKgDialogOpen] = useState(false);
  const [kgData, setKgData] = useState(null); // parsed KG series

  useEffect(() => {
    if (brainEntries) {
      const editBrains = brainEntries.map((entry) => entry.name);
      setEditBrainsList(editBrains);
      logger.debug("Edit brains list", { count: editBrains?.length });
    }
  }, [brainEntries]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes fully otherwise stuck with the old uploads
      setFilesToUpload([]);
      setName("");
      setUploadProgress(0);
      setKgData(null);
    }
  }, [open]);

  const handleKGSelect = (parsed) => {
    setKgData(parsed);
    setName(parsed.name);
  };

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
        const batchSize = 4; // Process 4 files at a time
        const allResults = [];

        // Process files in batches of 4
        for (let i = 0; i < filesToUpload.length; i += batchSize) {
          // Get the current batch of files
          const batch = filesToUpload.slice(i, i + batchSize);

          // Upload this batch in parallel
          const batchPromises = batch.map((file) =>
            uploadToPath(
              token,
              collabName,
              project.name,
              name + "/raw_images/",
              file
            ).then((result) => {
              // Increment completed count and update progress
              completedUploads++;
              setUploadProgress(
                (completedUploads / filesToUpload.length) * 100
              );
              return { ...result, originalFile: file };
            })
          );

          // Wait for current batch to complete before moving to next batch
          const batchResults = await Promise.all(batchPromises);
          allResults.push(...batchResults);
        }

        setIsUploading(false);
        showSuccess("Files uploaded successfully");
        return allResults;
      } catch (error) {
        setIsUploading(false);
        logger.error("Error uploading files", error);
        showError("Error uploading files");
        throw error;
      }
    }
    setIsUploading(false);
    return [];
  };

  const handleSubmit = async () => {
    if (!name || name.trim() === "") {
      showError("An image series name is required");
      return;
    }

    if (kgData) {
      // KG import mode: fetch the series JSON from the service link and store it
      const collabName = localStorage.getItem("bucketName");
      setIsUploading(true);
      try {
        if (!kgData.series) {
          throw new Error("No series URL found in KG data");
        }
        const seriesFileName = kgData.series.split("/").pop();
        const seriesUrl = new URL(kgData.series);
        seriesUrl.searchParams.set("redirect", "false");
        const redirectResp = await fetch(seriesUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!redirectResp.ok) {
          throw new Error(`Failed to resolve series URL: ${redirectResp.status}`);
        }
        const { url: downloadUrl } = await redirectResp.json();
        if (!downloadUrl) {
          throw new Error("No download URL returned from series endpoint");
        }
        const seriesResp = await fetch(downloadUrl);
        if (!seriesResp.ok) {
          throw new Error(`Failed to fetch series JSON: ${seriesResp.status}`);
        }
        const seriesContent = await seriesResp.json();
        await uploadToJson(
          { token, bucketName: collabName, projectName: project.name, brainName: name },
          seriesFileName,
          seriesContent
        );
        // Track KG-sourced brains in localStorage for UI differentiation
        const kgKey = "kgBrains";
        const existing = JSON.parse(localStorage.getItem(kgKey) || "[]");
        const brainPath = `${project.name}/${name}`;
        if (!existing.includes(brainPath)) {
          localStorage.setItem(kgKey, JSON.stringify([...existing, brainPath]));
        }
        showSuccess("KG series imported successfully");
        onUploadComplete?.();
        onClose();
      } catch (error) {
        logger.error("Error importing KG series", error);
        showError("Failed to import KG series");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (filesToUpload.length === 0) {
      showWarning("Please select files to upload");
      return;
    }

    try {
      await uploadFiles();
      onUploadComplete?.();
      onClose();
    } catch (error) {
      logger.error("Error in handleSubmit", error);
    }
  };

  return (
    <>
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

          {kgData ? (
            <Box sx={{ border: "1px solid", borderColor: "info.main", borderRadius: 1, p: 2, bgcolor: "#e8f4fd" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <StorageIcon fontSize="small" color="info" />
                <Chip label="KG Dataset" color="info" size="small" />
                <Button size="small" onClick={() => { setKgData(null); setName(""); }}>Clear</Button>
              </Box>
              <Typography variant="body2"><strong>Atlas:</strong> {kgData.atlas}</Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}><strong>Series:</strong> {kgData.series}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{kgData.doi}</Typography>
            </Box>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<StorageIcon />}
                onClick={() => setKgDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Import from KG Datasets
              </Button>
              <UploadZone onFilesSelected={handleFilesSelected} />
            </>
          )}
          {isUploading && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <DialogContentText>
                {kgData ? "Importing..." : `Uploading: ${Math.round(uploadProgress)}%`}
              </DialogContentText>
              {!kgData && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "20px" }}>
          <Button onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (kgData ? "Importing..." : "Uploading...") : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
      <KGImportDialog
        open={kgDialogOpen}
        onClose={() => setKgDialogOpen(false)}
        onSelect={handleKGSelect}
        token={token}
      />
    </>
  );
}
