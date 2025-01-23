import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  Switch,
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
  Search,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import mBrain from "../mBrain.ico";

import { fetchBrainSegmentations } from "../actions/handleCollabs";
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
  const [objectSplitting, setObjectSplitting] = useState(false);
  const [segmentations, setSegmentations] = useState([]);
  const [selectedSegmentations, setSelectedSegmentations] = useState([]);
  const [isFetchingSegmentations, setIsFetchingSegmentations] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);

  // Uploading segments window for custom images
  const [uploadSegmentsOpen, setUploadSegmentsOpen] = useState(false);

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

  const handleBrainSelect = (brain) => {
    setSelectedBrain(brain);
    localStorage.setItem("selectedBrain", JSON.stringify(brain));
    getSegmentations(brain);
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

                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
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
                  {selectedBrain?.name === entry.name ? (
                    <ListItemIcon>
                      <Search sx={{ color: "primary.main" }} />
                    </ListItemIcon>
                  ) : null}
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
        {/* Right Toolbar */}
      </Box>

      {/* Image list
      - > Allows custom uploads from the user made with Ilastik
      - > Displays the segmentations filled via webilastik
      */}
      <Box sx={{ ...styles.listContainer, flex: 2 }}>
        <Stack
          sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}
          direction="row"
          spacing={1}
        >
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
          <Button startIcon={<Delete />} size="small" color="error">
            Delete
          </Button>
        </Stack>

        <List dense sx={{ overflow: "auto", height: "calc(96% - 48px)" }}>
          {" "}
          {/* Added dense prop for more compact list */}
          {isFetchingSegmentations ? (
            <ListItem>
              <Box sx={{ width: "100%", textAlign: "center", py: 1 }}>
                {" "}
                <CircularProgress size={20} />
                <Typography sx={{ mt: 0.5 }}>
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
      {/* Results Panel */}
      <Box
        sx={{
          width: "40%",
          overflow: "hidden",
          opacity: 1,
        }}
      >
        <Box sx={{ ...styles.listContainer }}>
          <Typography
            variant="subtitle2"
            sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}
          >
            Quantification and Utilities
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              padding: 2,
            }}
          >
            <Typography variant="h6" sx={{ textAlign: "left" }}>
              Settings
            </Typography>
            <List
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              <ListItem
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle2">
                      Object Splitting
                    </Typography>
                    <Tooltip title="Enable to ?">
                      <Info fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                  <Switch
                    checked={objectSplitting}
                    onChange={(e) => setObjectSplitting(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Box>
                  <TextField
                    type="color"
                    size="small"
                    label="Object color"
                    helperText="Select the object of interest color in the segmentations"
                    fullWidth
                    sx={{
                      '& input[type="color"]': {
                        width: "100%",
                      },
                    }}
                    defaultValue="#000000"
                  />
                </Box>
              </ListItem>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  width: "100%",
                  mt: "auto",
                }}
              >
                <Button
                  fullWidth
                  sx={styles.toolbarButton}
                  startIcon={<Analytics />}
                >
                  Run quantification
                </Button>

                <Button
                  fullWidth
                  sx={styles.toolbarButton}
                  startIcon={<Compare />}
                >
                  Compare images
                </Button>
              </Box>
            </List>
          </Box>
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #e0e0e0",
              flexDirection: "column",
              display: "flex",
              alignItems: "left",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ textAlign: "left" }}>
              Results
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "left" }}
            >
              Analysis results will appear here
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                width: "100%",
                mt: "auto",
              }}
            >
              <Button
                fullWidth
                sx={styles.toolbarButton}
                startIcon={<Calculate />}
              >
                Get statistics
              </Button>

              <Button
                fullWidth
                sx={styles.toolbarButton}
                startIcon={<SaveAlt />}
              >
                Export results
              </Button>
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
      </Box>
    </Box>
  );
};

export default Nutil;
