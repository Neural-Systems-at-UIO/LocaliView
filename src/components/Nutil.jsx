import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  LinearProgress,
  Typography,
  Stack,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Upload,
  Analytics,
  SaveAlt,
  Compare,
  Calculate,
  CloudDownload,
  CloudUpload,
  CheckCircle,
  Error,
  HourglassEmpty,
  BarChart,
  Help,
  Visibility,
  ImageOutlined,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import mBrain from "../mBrain.ico";

import {
  fetchBrainSegmentations,
  fetchBrainStats,
} from "../actions/handleCollabs";
import UploadSegments from "./UploadSegments";

// Nutil endpoint, one for submitting and one for polling the status
const NUTIL_URL = "https://pynutil.apps.ebrains.eu/";

// Shared styles object
const styles = {
  listContainer: {
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    height: "100%",
  },
  listItem: {
    "&:hover": {
      backgroundColor: "#f5f5f5",
      cursor: "pointer",
    },
    borderBottom: "1px solid #e0e0e0",
    transition: "all 0.2s ease",
  },
  toolbarButton: {
    textTransform: "none",
    width: "100%",
    maxWidth: "160px",
    whiteSpace: "nowrap",
    justifyContent: "flex-start",
    padding: "8px",
    color: "text.secondary",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
  expandButton: {
    position: "absolute",
    right: -24,
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderLeft: "none",
    borderRadius: "0 4px 4px 0",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
  resultsPanel: {
    position: "relative",
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    height: "100%",
    transition: "all 0.3s ease",
  },
};

// Implementation for the Nutil over the web
const Nutil = ({ token }) => {
  const [brainEntries, setBrainEntries] = useState([]);
  const [error, setError] = useState(null);

  const [segmentations, setSegmentations] = useState([]);
  const [selectedSegmentations, setSelectedSegmentations] = useState([]);

  const [isFetchingSegmentations, setIsFetchingSegmentations] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);

  // Uploading segments window for custom images
  const [uploadSegmentsOpen, setUploadSegmentsOpen] = useState(false);
  const [registration, setRegistration] = useState({
    atlas: null,
    last_modified: null,
    alignment_json_path: null,
  });
  const [objectColor, setObjectColor] = useState("#000000");
  const [isProcessing, setIsProcessing] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [completedResults, setCompletedResults] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

  // Color/jsx helper
  const getStatusInfo = (status) => {
    switch (status) {
      case "completed":
        return {
          color: "success.light",
          icon: <CheckCircle fontSize="small" />,
        };
      case "failed":
        return { color: "error.light", icon: <Error fontSize="small" /> };
      case "pending":
        return {
          color: "warning.light",
          icon: <HourglassEmpty fontSize="small" />,
        };
      case "downloading json":
        return {
          color: "info.light",
          icon: <CloudDownload fontSize="small" />,
        };
      case "downloading segments":
        return {
          color: "info.light",
          icon: <CloudDownload fontSize="small" />,
        };
      case "quantifying":
        return { color: "info.light", icon: <BarChart fontSize="small" /> };
      case "uploading":
        return { color: "info.light", icon: <CloudUpload fontSize="small" /> };
      default:
        return { color: "warning.light", icon: <Help fontSize="small" /> };
    }
  };

  const requestNutil = async () => {
    if (
      !selectedBrain ||
      !registration.atlas ||
      selectedSegmentations.length === 0
    ) {
      console.error("Missing required data for Nutil analysis");
      return;
    }

    setIsProcessing(true);
    try {
      const collabName = localStorage.getItem("bucketName");
      const brainPath = `${collabName}/${selectedBrain.path}`;

      // Extract the segmentation folder path from the selected segmentation
      const segmentationPath =
        selectedSegmentations[0].name.split("/").slice(0, -1).join("/") + "/";

      // Format object color from hex to RGB array
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      // Create timestamp-based output folder
      // the name of can be reworked
      const now = new Date();
      const dateStr = `${now.getDate()}_${now.getMonth() + 1}_${now
        .getFullYear()
        .toString()
        .slice(2)}`;
      const outputPath = `${brainPath}pynutil_results/${dateStr}`;

      // Create the request payload
      const payload = {
        segmentation_path: `${collabName}/${segmentationPath}`,
        alignment_json_path: `${collabName}/${registration.alignment_json_path}`,
        colour: hexToRgb(objectColor),
        output_path: outputPath,
        token: token,
      };

      console.log("Nutil analysis request payload:", payload);

      // Send the request to the PyNutil endpoint
      const response = await fetch("https://pynutil.apps.ebrains.eu/pynutil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Nutil analysis result:", result);

      // Add the new task to the tasks list with initial status
      if (result && result.task_id) {
        const newTask = {
          id: result.task_id,
          status: "pending",
          message: "Task submitted and processing...",
          createdAt: new Date(),
          brainName: selectedBrain.name,
          outputPath: outputPath,
        };

        setTasks((prev) => [...prev, newTask]);

        // Start polling for this task
        if (!isPolling) {
          setIsPolling(true);
        }
      }
    } catch (error) {
      console.error("Error requesting Nutil analysis:", error);
      setError("Failed to process Nutil analysis request");
    } finally {
      setIsProcessing(false);
    }
  };

  // To keep updating the results after submittion
  const pollTaskStatus = async (taskId) => {
    try {
      const response = await fetch(
        `https://pynutil.apps.ebrains.eu/status/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching task status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error polling task ${taskId}:`, error);
      return { status: "error", message: error.message };
    }
  };

  const fetchCompletedResults = async () => {
    if (!selectedBrain) return;

    try {
      const collabName = localStorage.getItem("bucketName");
      const brainPath = `${collabName}/${selectedBrain.path}`;
      const resultsPath = `${brainPath}pynutil_results`;

      // This would be your actual API call to fetch the results
      // For now, I'm just showing a placeholder
      // const response = await fetchBrainData(token, collabName, resultsPath);
      // setCompletedResults(response);

      // Placeholder for demonstration - replace with actual API call
      console.log("Fetching completed results from:", resultsPath);
      // setCompletedResults([]); // This would be populated from your API
    } catch (error) {
      console.error("Error fetching completed results:", error);
    }
  };

  // Call this when a brain is selected to fetch existing results
  useEffect(() => {
    if (selectedBrain) {
      fetchCompletedResults();
    }
  }, [selectedBrain]);

  useEffect(() => {
    let pollingInterval;

    if (tasks.length > 0 && isPolling) {
      pollingInterval = setInterval(async () => {
        let shouldContinuePolling = false;

        const updatedTasks = await Promise.all(
          tasks.map(async (task) => {
            // Continue polling for all statuses except completed and failed
            if (task.status !== "completed" && task.status !== "failed") {
              const statusResult = await pollTaskStatus(task.id);

              // Check if we need to continue polling
              if (
                statusResult.status !== "completed" &&
                statusResult.status !== "failed"
              ) {
                shouldContinuePolling = true;
              }

              // If the task just completed or failed, add it to completed results
              if (
                (statusResult.status === "completed" ||
                  statusResult.status === "failed") &&
                task.status !== "completed" &&
                task.status !== "failed"
              ) {
                // Task just completed or failed
                fetchCompletedResults(); // Refresh results list
                // TODO Add fetch here for the pynutil outputs folder.
              }

              return {
                ...task,
                status: statusResult.status,
                message: statusResult.message || task.message,
                completedAt:
                  statusResult.status === "completed" ||
                  statusResult.status === "failed"
                    ? new Date()
                    : null,
              };
            }
            return task;
          })
        );

        setTasks(updatedTasks);

        // If no tasks are still in progress, stop polling
        if (!shouldContinuePolling) {
          setIsPolling(false);
        }
      }, 3000); // Poll every 3 seconds - Eg to be discussed in a meeting
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [tasks, isPolling, token]);

  useEffect(() => {
    try {
      // Getting the brain entries from localstorage, previously set by clicking on a project
      const storedBrainEntries = localStorage.getItem("projectBrainEntries");
      if (storedBrainEntries) {
        const parsedEntries = JSON.parse(storedBrainEntries);
        setBrainEntries(parsedEntries);
        console.log("Brain entries loaded:", parsedEntries);
      }
    } catch (error) {
      console.error("Error loading brain entries:", error);
      setError("Failed to load brain entries");
    }
  }, []);

  const getSegmentations = async (brainEntry) => {
    if (!token) {
      alert("Please login to access this feature");
      return;
    }

    setIsFetchingSegmentations(true);
    try {
      let collabName = localStorage.getItem("bucketName");
      let brainPath = brainEntry.path;

      const response = await fetchBrainSegmentations(
        token,
        collabName,
        brainPath
      );
      if (response && response[0] && response[0].images) {
        const imageData = response[0].images;
        console.log("Brain segmentations fetched:", imageData);
        setSegmentations(imageData);
        setSelectedSegmentations(imageData);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error fetching brain segmentations:", error);
      setSegmentations([]);
      setError("Failed to fetch brain segmentations");
    } finally {
      setIsFetchingSegmentations(false);
    }
  };

  const handleBrainSelect = async (brain) => {
    try {
      setSelectedBrain(brain);
      // Resetting the segmentations and registration state when a new brain is selected
      // Much faster response time for the user
      setRegistration({
        atlas: null,
        last_modified: null,
        alignment_json_path: null,
      });
      setSegmentations([]);
      localStorage.setItem("selectedBrain", JSON.stringify(brain));
      await getSegmentations(brain);
      let seriesDescriptor = await fetchBrainStats(
        token,
        localStorage.getItem("bucketName"),
        brain.path,
        "jsons"
      );
      console.log(seriesDescriptor);
      if (seriesDescriptor[0]?.jsons?.[0]) {
        const filePath = seriesDescriptor[0].jsons[0].name;
        const atlasMatch = filePath.match(/\/([^\/]+)_\d{4}-\d{2}-\d{2}/);
        const atlas = atlasMatch ? atlasMatch[1] : null;
        const lastModified = seriesDescriptor[0].jsons[0].last_modified;

        await setRegistration({
          atlas: atlas,
          last_modified: lastModified,
          alignment_json_path: filePath,
        });
        console.log("Atlas registration found:", filePath);
      } else {
        console.log("No atlas registration found");
        await setRegistration({
          atlas: "Registration file not found",
          last_modified: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error selecting brain:", error);
      setError("Failed to select brain");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "99%",
        backgroundColor: "#f6f6f6",
        borderRadius: "4px",
        gap: 2,
        padding: 1,
      }}
    >
      {/* 
      Brain list
      - > Fetched from the initial chosen project on the main list and populated with the brains in localstorage
      - > Allows the user to select a brain to view the segmentations
      - > Features won't work if no token is provided
      Probably move this documentation somewhere else or get a consistent style for it
      */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1.2 }}>
        <Box sx={{ ...styles.listContainer, overflow: "auto" }}>
          <List>
            {brainEntries.length > 0 ? (
              brainEntries.map((entry, index) => (
                <ListItem
                  key={index}
                  sx={{
                    ...styles.listItem,
                    backgroundColor:
                      selectedBrain?.name === entry.name
                        ? "rgba(28, 148, 86, 0.08)"
                        : "transparent",
                    "&:hover": {
                      backgroundColor:
                        selectedBrain?.name === entry.name
                          ? "rgba(0, 0, 0, 0.12)"
                          : "rgba(0, 0, 0, 0.04)",
                      cursor: "pointer",
                    },
                  }}
                  onClick={() => handleBrainSelect(entry)}
                >
                  <ListItemIcon>
                    <img
                      src={mBrain}
                      alt="Brain Icon"
                      style={{ width: "1.75rem", height: "1.75rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={entry.name.split("/").pop()} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={"No brains available"}
                  sx={{ color: "error.main" }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>

      {/* Image list
      - > Allows custom uploads from the user made with Ilastik
      - > Displays the segmentations filled via webilastik
      */}
      <Box sx={{ ...styles.listContainer, flex: 2 }}>
        <Stack
          sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}
          direction="row"
          gap={3}
          spacing={1}
          justifyContent={"space-between"}
        >
          <Box>
            <Tooltip title="Upload your own segmentations from Ilastik">
              <Button
                startIcon={<Upload />}
                size="small"
                onClick={() => {
                  if (!selectedBrain) {
                    alert("Please select a brain first");
                  } else {
                    setUploadSegmentsOpen(true);
                  }
                }}
              >
                Upload Segmentations
              </Button>
            </Tooltip>
            <Button startIcon={<Delete />} size="small" color="error">
              Delete
            </Button>
          </Box>

          <Button
            startIcon={<Compare />}
            variant="contained"
            disableElevation
            size="small"
          >
            Compare
          </Button>
        </Stack>

        <List dense sx={{ overflow: "auto", height: "85vh" }}>
          {" "}
          {isFetchingSegmentations ? (
            <ListItem>
              <Box
                sx={{
                  width: "100%",

                  py: 1,
                  flexDirection: "row",
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                {" "}
                <CircularProgress size={20} />
                <Typography sx={{ mr: 0.5 }}>
                  {" "}
                  Loading segmentations...
                </Typography>
              </Box>
            </ListItem>
          ) : segmentations.length > 0 ? (
            segmentations.map((image, index) => (
              <ListItem
                key={image.hash + index}
                sx={{
                  ...styles.listItem,
                  py: 0.5,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)", // Subtle hover effect
                  },
                }}
              >
                <ListItemIcon>
                  <ImageOutlined />{" "}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {image.name.split("/").pop()}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption">
                      {new Date(image.last_modified).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        }
                      )}{" "}
                      • {(image.bytes / 1024 / 1024).toFixed(1)}MB
                    </Typography>
                  }
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    No segmentations found
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Box>

      <Box
        sx={{
          flex: 2,
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          backgroundColor: "white",
          height: "100%",
        }}
      >
        <Box sx={{ height: "98%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 1.5, borderBottom: "1px solid #e0e0e0" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography variant="body2">Quantification Settings</Typography>
              <Button
                variant="contained"
                disableElevation
                size="small"
                startIcon={<Analytics />}
                disabled={!registration.atlas || isProcessing}
                onClick={requestNutil}
              >
                {isProcessing ? "Processing..." : "Run analysis"}
              </Button>
            </Box>
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 1.5,
                mb: 1.5,
                backgroundColor: "grey.50",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Reference Atlas
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {registration.atlas || "No atlas selected"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Last modified:{" "}
                {registration.last_modified
                  ? new Date(registration.last_modified).toLocaleString(
                      "no-NO",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }
                    )
                  : "Never"}
              </Typography>
            </Box>

            <Box
              sx={{
                // Settings panel
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1 }}>
                {/*<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="caption">Output</Typography>
                  <Tooltip title="Select whether to display object counts or area fraction (percentage) of objects within atlas regions">
                    <Info
                      fontSize="small"
                      sx={{ fontSize: 14 }}
                      color="action"
                    />
                  </Tooltip>
                </Box>
                
                <FormControl fullWidth size="small">
                  <Select
                    value={outputType}
                    onChange={(e) => setOutputType(e.target.value)}
                    variant="standard"
                    sx={{ minHeight: "32px" }}
                  >
                    <MenuItem value="counts">Counts</MenuItem>
                    <MenuItem value="areaFraction">Area Fraction</MenuItem>
                  </Select>
                </FormControl>
                */}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Object Color
                </Typography>
                <TextField
                  type="color"
                  size="small"
                  fullWidth
                  defaultValue="#000000"
                  onChange={(e) => setObjectColor(e.target.value)}
                  sx={{
                    '& input[type="color"]': {
                      padding: "2px",
                      height: "32px",
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box
            sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="body2" gutterBottom>
              Results
            </Typography>
            <Box
              sx={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 1.5,
                backgroundColor: "grey.50",
                mb: 1.5,
                overflowY: "auto",
              }}
            >
              {/* Task Status Section */}
              <Typography variant="subtitle2" gutterBottom>
                Job Status
              </Typography>

              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const statusInfo = getStatusInfo(task.status);
                  return (
                    <Box
                      key={task.id}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        p: 1.5,
                        mb: 1.5,
                        backgroundColor: "white",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "medium" }}
                        >
                          Task: {task.id.substring(0, 8)}...
                        </Typography>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: statusInfo.color,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {statusInfo.icon}
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: "medium" }}
                          >
                            {task.status.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        {task.message ||
                          `Processing ${task.brainName.split("/").pop()}`}
                      </Typography>

                      {task.status !== "completed" &&
                        task.status !== "failed" && (
                          <LinearProgress
                            sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
                          />
                        )}

                      {task.status === "completed" && (
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="outlined"
                          sx={{ mt: 1.5 }}
                          onClick={() => {
                            // Add logic to view results
                          }}
                        >
                          View Results
                        </Button>
                      )}

                      {task.completedAt && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, color: "text.secondary" }}
                        >
                          Completed at: {task.completedAt.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  No active jobs
                </Typography>
              )}

              {/* Completed Results Section */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                Available Results
              </Typography>

              {completedResults && completedResults.length > 0 ? (
                completedResults.map((result, index) => (
                  <Box
                    key={index}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: "white",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {result.name.split("/").pop()}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {new Date(result.created).toLocaleString()}
                    </Typography>
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      startIcon={<Analytics />}
                      variant="outlined"
                    >
                      View Results
                    </Button>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No completed results available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Submit a job to generate results
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" startIcon={<Calculate />} fullWidth>
                Plotting and Viewers
              </Button>
              <Button size="small" startIcon={<SaveAlt />} fullWidth>
                Export Results
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <UploadSegments
        open={uploadSegmentsOpen}
        onClose={() => setUploadSegmentsOpen(false)}
        token={token}
        project={JSON.parse(localStorage.getItem("selectedProject"))}
        brain={selectedBrain}
        onUploadComplete={() => getSegmentations(selectedBrain)}
      />
    </Box>
  );
};

export default Nutil;
