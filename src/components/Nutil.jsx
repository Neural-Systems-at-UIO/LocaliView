import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Select,
  MenuItem,
  Divider,
  Button,
  Switch,
  Typography,
  Stack,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  Edit,
  Delete,
  Add,
  Upload,
  Analytics,
  SaveAlt,
  Compare,
  Calculate,
  Info,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import mBrain from "../mBrain.ico";

import { fetchBrainSegmentations } from "../actions/handleCollabs";

// Shared styles object
const styles = {
  listContainer: {
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    height: "100%",
    overflow: "auto",
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
    justifyContent: "flex-start",
    padding: "8px",
    color: "text.secondary",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
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
    setIsFetchingSegmentations(true);
    try {
      let collabName = localStorage.getItem("bucketName");
      let brainPath = brainEntry.path; // Use the selected brain's path

      const response = await fetchBrainSegmentations(
        token,
        collabName,
        brainPath
      );
      if (response) {
        console.log("Brain segmentations fetched:", response);
        setSegmentations(response);
        setSelectedSegmentations(response);
        localStorage.setItem("projectBrainEntries", JSON.stringify(response));
      }
    } catch (error) {
      console.error("Error fetching brain segmentations:", error);
      setError("Failed to fetch brain segmentations");
    } finally {
      setIsFetchingSegmentations(false);
    }
  };

  const handleBrainSelect = (brain) => {
    setSelectedBrain(brain);
    getSegmentations(brain);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        backgroundColor: "#f6f6f6",
        borderRadius: "4px",
        gap: 2,
        padding: 2,
      }}
    >
      {/* 
      Brain list
      - > Fetched from the initial chosen project on the main list and populated with the brains in localstorage
      */}
      <Box sx={{ ...styles.listContainer, width: "15%", height: "50%" }}>
        <List>
          {brainEntries.length > 0 ? (
            brainEntries.map((entry, index) => (
              <ListItem
                key={index}
                sx={{
                  ...styles.listItem,
                  backgroundColor:
                    selectedBrain?.name === entry.name
                      ? "#e3f2fd"
                      : "transparent",
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

      {/* Image list
      - > Allows custom uploads from the user made with QuickNII

      */}
      <Box sx={{ ...styles.listContainer, width: "35%" }}>
        <Stack
          sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}
          direction="row"
          spacing={1}
        >
          <Button startIcon={<Upload />} size="small">
            Upload Segmentations
          </Button>
          <Button startIcon={<Delete />} size="small" color="error">
            Delete
          </Button>
        </Stack>

        <List>
          {isFetchingSegmentations ? (
            <ListItem>
              <Box sx={{ width: "100%", textAlign: "center", py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading segmentations...
                </Typography>
              </Box>
            </ListItem>
          ) : segmentations.length > 0 ? (
            segmentations.map((item) => (
              <ListItem
                key={item.name}
                sx={styles.listItem}
                secondaryAction={<Switch edge="end" />}
              >
                <ListItemText
                  primary={item.name}
                  secondary={`Files: ${item.files} | Size: ${(
                    item.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No segmentations found" />
            </ListItem>
          )}
        </List>
      </Box>

      {/* Right Toolbar */}
      <Box sx={{ ...styles.listContainer, width: "45%" }}>
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
            height: "calc(96% - 60px)", // Account for header
            padding: 2,
          }}
        >
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
                  <Typography variant="subtitle2">Object Splitting</Typography>
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
                mt: "auto", // Push to bottom
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
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default Nutil;
