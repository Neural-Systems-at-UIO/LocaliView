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
  InputLabel,
  FormControl,
  ToggleButton,
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

const Nutil = ({ token }) => {
  const [brainEntries, setBrainEntries] = useState([]);
  const [error, setError] = useState(null);
  const [objectSplitting, setObjectSplitting] = useState(false);

  const [selectedBrain, setSelectedBrain] = useState(null);

  useEffect(() => {
    try {
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
    try {
      let collabName = localStorage.getItem("bucketName");
      let brainPath = brainEntry.path; // Use the selected brain's path

      const response = await fetchBrainSegmentations(
        token,
        collabName,
        brainPath
      );
      if (response.status === 200) {
        const data = await response.json();
        setBrainEntries(data);
        localStorage.setItem("projectBrainEntries", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error fetching brain segmentations:", error);
      setError("Failed to fetch brain segmentations");
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
                primary={error || "No brains available"}
                sx={{ color: error ? "error.main" : "text.secondary" }}
              />
            </ListItem>
          )}
        </List>
      </Box>

      {/* Image list
      - > Allows custom uploads from the user made with QuickNII

      */}
      <Box sx={{ ...styles.listContainer, width: "35%" }}>
        <Stack sx={{ p: 2 }} direction="row" spacing={1}>
          <Button startIcon={<Upload />} size="small">
            Upload Segmentations
          </Button>
          <Button startIcon={<Delete />} size="small" color="error">
            Delete
          </Button>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <List>
          {[1, 2, 3, 4, 5].map((item) => (
            <ListItem
              key={item}
              sx={styles.listItem}
              secondaryAction={<Switch edge="end" />}
            >
              <ListItemText
                primary={`Image ${item}`}
                secondary={`Segmentation ${item}`}
              />
            </ListItem>
          ))}
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
            width: "40%",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: 2,
            padding: 2,
            margin: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              px: 1,
            }}
          >
            Settings
          </Typography>

          <List
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
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
            </ListItem>
            <ListItem sx={{ py: 1 }}>
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
            </ListItem>
            <ListItem>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    sx={styles.toolbarButton}
                    startIcon={<Analytics />}
                  >
                    Run quantification
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    sx={styles.toolbarButton}
                    startIcon={<Compare />}
                  >
                    Compare images
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    sx={styles.toolbarButton}
                    startIcon={<Calculate />}
                  >
                    Get statistics
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    sx={styles.toolbarButton}
                    startIcon={<SaveAlt />}
                  >
                    Export results
                  </Button>
                </Grid>
              </Grid>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default Nutil;
