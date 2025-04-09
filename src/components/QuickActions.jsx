import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Button,
  LinearProgress,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
  ListItemIcon,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import InfoIcon from "@mui/icons-material/Info";
// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

import { useState, useEffect } from "react";

import Atlas from "./Atlas";
// Icons
import {
  AutoAwesomeMotionSharp,
  ImageSharp,
  FolderOff,
  Share,
} from "@mui/icons-material";

import { deleteItem } from "../actions/handleCollabs";

// Importing deepzoom here
const DEEPZOOM_URL = import.meta.env.VITE_APP_DEEPZOOM_URL;

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// To fit some of the dates in case of long names
const dateOptions = {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "short",
  year: "2-digit",
};

const QuickActions = ({
  braininfo,
  stats,
  isLoading,
  token,
  setSelectedBrain,
  refreshBrain,
  refreshProjectBrains,
}) => {
  let pyramidCount = stats[1]?.zips.length || 0;
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bucketName, setBucketName] = useState(null);
  // current work alignment file
  const [alignment, setAlignment] = useState(
    localStorage.getItem("alignment") || null
  );
  // Info messages
  const [infoMessage, setInfoMessage] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [taskStatus, setTaskStatus] = useState({});
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      setUser(userInfo.username);
      setBucketName(localStorage.getItem("bucketName"));
    } catch (error) {
      console.error("Error parsing userInfo:", error);
    }
  }, [token, stats]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const processImage = async (imageFile, bucket, targetPath, token) => {
    try {
      const response = await fetch(DEEPZOOM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: `${bucket}/${imageFile.path}`,
          target_path: `${bucket}/${targetPath}`,
          token: token,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        fileName: imageFile.name,
        filePath: imageFile.path,
        taskId: data.task_id,
        statusEndpoint: data.status_endpoint,
        status: data.status,
      };
    } catch (error) {
      console.error(`Error processing file ${imageFile.name}:`, error);
      throw error;
    }
  };

  const processTiffFiles = async () => {
    if (!braininfo || !stats[0]?.tiffs?.length) {
      alert("No TIFF files found to process");
      return;
    }

    setIsProcessing(true);
    const sourceBrain = braininfo.path;
    const imageFiles = stats[0].tiffs.map((tiffObj) => ({
      path: tiffObj.name,
      name: tiffObj.name.split("/").pop(),
    }));

    try {
      // Initialize task status for each file
      const initialStatus = {};
      imageFiles.forEach((file) => {
        initialStatus[file.path] = { status: "pending", progress: 0 };
      });
      setTaskStatus(initialStatus);

      // Start processing and collect task info
      const tasks = await Promise.all(
        imageFiles.map((imageFile) => {
          const targetPath = `${sourceBrain}zipped_images/`;
          return processImage(imageFile, bucketName, targetPath, token);
        })
      );

      // Store the tasks information
      const tasksInfo = {};
      tasks.forEach((task) => {
        tasksInfo[task.filePath] = {
          taskId: task.taskId,
          fileName: task.fileName,
          statusEndpoint: task.statusEndpoint,
          status: task.status,
          progress: 0,
        };
      });

      setTaskStatus(tasksInfo);

      if (pollingInterval) {
        clearInterval(pollingInterval);
      }

      // Set up polling for all tasks - using a ref to track completion
      let completionCheck = false;

      const interval = setInterval(async () => {
        // Get the CURRENT task status (not from closure)
        const currentTaskStatus = { ...tasksInfo }; // Start with initial tasks
        let allCompleted = true;
        let hasActiveTask = false;

        // Check each task's current status
        for (const [filePath, taskInfo] of Object.entries(currentTaskStatus)) {
          if (taskInfo.statusEndpoint) {
            try {
              const status = await pollTaskStatus(
                taskInfo.statusEndpoint,
                filePath
              );

              // If any task is still processing, we're not done
              if (status.status !== "completed" && status.status !== "error") {
                allCompleted = false;
                hasActiveTask = true;
              }
            } catch (error) {
              console.error(`Error polling task ${filePath}:`, error);
            }
          }
        }

        // Only stop and refresh if we had tasks and they're all done
        if (
          allCompleted &&
          !completionCheck &&
          Object.keys(currentTaskStatus).length > 0
        ) {
          completionCheck = true;
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessing(false);

          // Small delay to ensure final status updates are reflected in UI
          setTimeout(() => {
            refreshBrain(); // Refresh to show new files
          }, 1000);
        }
      }, 5000); // Poll every 5 seconds

      setPollingInterval(interval);

      alert(`Processing ${imageFiles.length} files - see progress below`);
    } catch (error) {
      console.error("Error processing TIFF files:", error);
      alert("Error processing TIFF files. Check the console for details.");
      setIsProcessing(false);
    }
  };

  const pollTaskStatus = async (statusEndpoint, filePath) => {
    try {
      const response = await fetch(
        `https://deepzoom.apps.ebrains.eu${statusEndpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const statusData = await response.json();

      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [filePath]: statusData,
      }));

      return statusData;
    } catch (error) {
      console.error(`Error polling status:`, error);
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [filePath]: {
          status: "error",
          error: error.message,
          progress: 0,
        },
      }));
      return { status: "error", error: error.message };
    }
  };

  const calculateOverallProgress = () => {
    if (!isProcessing || Object.keys(taskStatus).length === 0) {
      return (pyramidCount / (brainStats.files || 1)) * 100;
    }

    const tasks = Object.values(taskStatus);
    const totalProgress = tasks.reduce(
      (sum, task) => sum + (task.progress || 0),
      0
    );
    return Math.round(totalProgress / tasks.length);
  };

  if (!braininfo) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <Typography variant="h5" color="textSecondary">
          Choose an image series to view additional information.
          <br />
          If there are none, add a new series by clicking on the 'Add/Edit
          Series' button.
        </Typography>
      </Box>
    );
  }

  const brainStats = stats[0] || {};
  const brainPyramids = stats[1] || {};
  const walnJson = stats[2] || {};
  let registered = walnJson.jsons?.length >= 1;

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          width: "100%",
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Loading series...
        </Typography>
        <CircularProgress size={15} />
      </Box>
    );
  }

  const pyramidComplete = pyramidCount === brainStats.files;

  return (
    <Box sx={{ height: "auto" }}>
      <Snackbar
        open={infoMessage.open}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => setInfoMessage({ ...infoMessage, open: false })}
          severity={infoMessage.severity}
          elevation={4}
        >
          {infoMessage.message}
        </Alert>
      </Snackbar>
      <Grid
        container
        spacing={2}
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Grid size={3}>
          <Card
            sx={{
              boxShadow: "none",
              border: "1px solid #e0e0e0",
              height: "100%",
            }}
          >
            <Typography
              variant="h5"
              color="primary"
              gutterBottom
              sx={{
                fontWeight: "bold",
                wordBreak: "break-word", // Allows breaking long words if needed, this is the case/solution for now
                overflow: "hidden",
                textOverflow: "ellipsis", // Show ellipsis for text that still overflows
                borderBottom: "1px solid #e0e0e0",
                padding: 2,
                width: "100%",
              }}
              textAlign="left"
            >
              {braininfo.name}
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Total Images in Series"
                  secondary={brainStats.files || "N/A"}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "0.8rem",
                    },
                    "& .MuiListItemText-secondary": {
                      fontSize: "0.7rem",
                    },
                  }}
                />
                <Tooltip title="You can add more images from the 'Add or Edit' button">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Size of the Series"
                  secondary={
                    brainStats.size ? formatFileSize(brainStats.size) : "N/A"
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "0.8rem",
                    },
                    "& .MuiListItemText-secondary": {
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last updated on"
                  secondary={new Date().toLocaleString()}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "0.8rem",
                    },
                    "& .MuiListItemText-secondary": {
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </ListItem>
            </List>
            {/** 
            * <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 2,
                p: 2,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={async (e) => {
                  try {
                    e.preventDefault();

                    setInfoMessage({
                      open: true,
                      message: "Deleting series...",
                      severity: "info",
                    });
                    console.log("Deleting", bucketName + "/" + braininfo.path);
                    await deleteItem(bucketName + "/" + braininfo.path, token);
                    await setTimeout(() => {
                      refreshProjectBrains();
                      setInfoMessage({
                        open: true,
                        message: "Series deleted successfully",
                        severity: "success",
                      });
                    }, 2000);
                  } catch (error) {
                    console.error("Error deleting item:", error);
                    setInfoMessage({
                      open: true,
                      message: "Error deleting series",
                      severity: "error",
                    });
                  }
                }}
              >
                Delete
              </Button>
              <Button size="small" startIcon={<Share />} disabled={true}>
                Share
              </Button>
            </Box>
           */}
          </Card>
        </Grid>
        <Grid size={9}>
          <Card
            sx={{
              boxShadow: "none",
              border: "1px solid #e0e0e0",
              opacity: registered ? 0.5 : 1,
              "&:hover": {
                cursor: registered ? "not-allowed" : "default",
              },
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  mb: 2,
                  width: "100%",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    mb: { xs: 2, sm: 0 },
                    width: "100%",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      textWrap: "wrap",
                      textAlign: "left",
                      fontSize: 20,
                      mb: 2,
                    }}
                  >
                    Convert images to DZI format
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, textAlign: "left" }}
                      >
                        Images to be converted:{" "}
                        {Math.max(
                          0,
                          brainStats.files - (stats[1]?.zips.length || 0)
                        )}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          maxHeight: 200,
                          overflow: "auto",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          mt: 1,
                        }}
                      >
                        <List>
                          {brainStats.tiffs?.map((tiff, index) => {
                            const filePath = tiff.name;
                            const fileStatus = taskStatus[filePath];

                            return (
                              <ListItem
                                key={index}
                                sx={{
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    backgroundColor: "action.hover",
                                  },
                                  "&:last-child": {
                                    borderBottom: "none",
                                  },
                                  justifyContent: "space-between",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  py: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <ListItemIcon>
                                      <ImageSharp />
                                    </ListItemIcon>
                                    <Typography
                                      sx={{
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        fontSize: 12,
                                      }}
                                    >
                                      {tiff.name.split("/").slice(-1)[0]}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ display: "flex", gap: 2 }}>
                                    <Typography sx={{ fontSize: 12 }}>
                                      {formatFileSize(tiff.bytes)}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12 }}>
                                      {new Date(
                                        tiff.last_modified
                                      ).toLocaleString("en-GB", dateOptions)}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Show progress when processing */}
                                {isProcessing && fileStatus && (
                                  <Box sx={{ width: "100%", mt: 0.5 }}>
                                    {fileStatus.status === "pending" && (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        Waiting to process...
                                      </Typography>
                                    )}
                                    {fileStatus.status === "accepted" ||
                                    fileStatus.status === "processing" ? (
                                      <>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            sx={{ color: "primary.main" }}
                                          >
                                            {fileStatus.current_step ||
                                              "Processing..."}
                                          </Typography>
                                          <Typography variant="caption">
                                            {fileStatus.progress || 0}%
                                          </Typography>
                                        </Box>
                                        <LinearProgress
                                          variant="determinate"
                                          value={fileStatus.progress || 0}
                                          sx={{ height: 3, borderRadius: 1 }}
                                        />
                                      </>
                                    ) : fileStatus.status === "completed" ? (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "success.main" }}
                                      >
                                        Completed ✓
                                      </Typography>
                                    ) : (
                                      fileStatus.status === "error" && (
                                        <Typography
                                          variant="caption"
                                          sx={{ color: "error.main" }}
                                        >
                                          Error:{" "}
                                          {fileStatus.error ||
                                            "Processing failed"}
                                        </Typography>
                                      )
                                    )}
                                  </Box>
                                )}
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, textAlign: "left" }}
                      >
                        Converted images: {stats[1]?.zips.length || 0}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          maxHeight: 200,
                          overflow: "auto",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          mt: 1,
                        }}
                      >
                        <List>
                          {stats[1]?.zips?.length > 0 ? (
                            stats[1]?.zips?.map((zip, index) => (
                              <ListItem
                                key={index}
                                sx={{
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    backgroundColor: "action.hover",
                                  },
                                  "&:last-child": {
                                    borderBottom: "none",
                                  },
                                  justifyContent: "space-between",
                                }}
                              >
                                <ListItemIcon>
                                  <AutoAwesomeMotionSharp />
                                </ListItemIcon>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: 12,
                                    textAlign: "left",
                                  }}
                                >
                                  {zip.name.split("/").slice(-1)[0]}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: 12,
                                  }}
                                >
                                  {formatFileSize(zip.bytes)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: 12,
                                  }}
                                >
                                  {new Date(zip.last_modified).toLocaleString(
                                    "en-GB",
                                    dateOptions
                                  )}
                                </Typography>
                              </ListItem>
                            ))
                          ) : (
                            <ListItem
                              sx={{
                                height: "100%",
                                minHeight: 200, // Ensures minimum height
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: 1,
                                opacity: 0.8,
                              }}
                            >
                              <ListItemIcon>
                                <FolderOff sx={{ fontSize: "2rem" }} />
                              </ListItemIcon>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  textAlign: "center",
                                }}
                              >
                                No processed files
                                <br />
                                Click the process button to start
                              </Typography>
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ mt: 3, width: "100%" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        textAlign: "left",
                        color: "text.secondary",
                      }}
                    >
                      Progress: {pyramidCount} / {brainStats.files || 0} images
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={calculateOverallProgress()}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: (theme) => theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      variant="outlined"
                      disabled={
                        isProcessing ||
                        pyramidComplete ||
                        brainStats.files === 0
                      }
                      onClick={() => {
                        processTiffFiles();
                      }}
                      sx={{
                        size: "md",
                        borderColor: (theme) => theme.palette.grey[800],
                        color: (theme) => theme.palette.grey[800],
                        "&:hover": {
                          borderColor: (theme) => theme.palette.grey[900],
                          backgroundColor: (theme) =>
                            theme.palette.action.hover,
                        },
                        mt: 3,
                      }}
                    >
                      {pyramidComplete
                        ? "Complete"
                        : isProcessing
                        ? "Converting..."
                        : "Convert"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2,
          boxShadow: "none",
          border: "1px solid #e0e0e0",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          p: 1,
          borderRadius: 1,
        }}
      >
        {!registered && (
          <Atlas
            token={token}
            bucketName={bucketName}
            dzips={brainPyramids.zips}
            updateInfo={setInfoMessage}
            refreshBrain={refreshBrain}
          />
        )}

        {registered && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              p: 0,
            }}
          >
            <Card sx={{ boxShadow: "none", width: "100%" }}>
              <CardContent
                sx={{
                  p: 1,
                  "&:last-child": {
                    pb: 1, // Override the default padding-bottom
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography>
                      Registration file:{" "}
                      {walnJson.jsons?.[0]?.name.split("/").slice(-1)[0] ||
                        "None"}
                    </Typography>
                    {/*<Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {walnJson.jsons?.[0]?.last_modified
                        ? `Last modified: ${new Date(
                            walnJson.jsons[0].last_modified
                          ).toLocaleString()}`
                        : ""}
                    </Typography>*/}
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Tooltip title="Delete registration">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (!(bucketName && walnJson.jsons?.[0]?.name)) {
                            setInfoMessage({
                              open: true,
                              message: "No registration file to delete",
                              severity: "warning",
                            });

                            return;
                          }
                          deleteItem(
                            bucketName + "/" + walnJson.jsons?.[0]?.name,
                            token
                          );
                          console.log(
                            "Deleting",
                            bucketName + "/" + walnJson.jsons?.[0]?.name
                          );
                          setInfoMessage({
                            open: true,
                            message: "Registration file is being deleted",
                            severity: "info",
                          });
                          setTimeout(() => {
                            refreshBrain();
                          }, 2000);
                        }}
                        disabled={!walnJson.jsons?.[0]}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Button not used for now
                    <Tooltip title="Overwrite alignment">
                      <IconButton
                        size="small"
                        onClick={() => {
                          // Handle overwrite
                        }}
                        disabled={!walnJson.jsons?.[0]}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip> */}

                    <Tooltip title="Set this registration to use as working alignment">
                      <Button
                        size="small"
                        sx={{
                          // Visiblity change if selected color agnostic
                          backgroundColor:
                            alignment === walnJson.jsons?.[0]?.name
                              ? "primary.main"
                              : "transparent",
                          color:
                            alignment === walnJson.jsons?.[0]?.name
                              ? "white"
                              : "primary.main",
                        }}
                        onClick={() => {
                          // TODO: Wrap this guy in try soon

                          setInfoMessage({
                            open: true,
                            message: "Alignment set",
                            severity: "info",
                          });

                          setAlignment(walnJson.jsons?.[0]?.name);
                          localStorage.setItem(
                            "alignment",
                            walnJson.jsons?.[0].name
                          );
                        }}
                      >
                        {alignment === walnJson.jsons?.[0]?.name
                          ? "Current working registration"
                          : "Set as working registration"}
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QuickActions;
