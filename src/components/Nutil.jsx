import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
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
  Info,
  ImageOutlined,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import mBrain from "../mBrain.ico";

import {
  fetchBrainSegmentations,
  fetchBrainStats,
} from "../actions/handleCollabs";
import UploadSegments from "./UploadSegments";

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
  // Object splitting
  const [outputType, setOutputType] = useState("counts");
  const [registration, setRegistration] = useState({
    atlas: null,
    last_modified: null,
  });

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
        });
        console.log("Atlas registration found:", registration);
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
        height: "96%",
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

        <List dense sx={{ overflow: "auto", height: "calc(96% - 48px)" }}>
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
                disabled={!registration.atlas}
                // Checking whether the atlas registration is complete
                // implies only segmentations aren't enough and we need further info detailed in the registration file
              >
                Run analysis
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Analysis results will appear here
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" startIcon={<Calculate />} fullWidth>
                Get Statistics
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
