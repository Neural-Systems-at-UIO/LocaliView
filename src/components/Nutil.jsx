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
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Upload,
  Analytics,
  SaveAlt,
  Compare,
  Calculate,
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
      <Box sx={{ ...styles.listContainer, width: "25%" }}>
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
      <Box sx={{ ...styles.listContainer, width: "25%" }}>
        <Typography
          variant="subtitle2"
          sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}
        >
          Quantification and Utilities
        </Typography>

        <List>
          <ListItem
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2">Object Splitting</Typography>
            <ToggleButton
              value={objectSplitting}
              selected={objectSplitting}
              onChange={() => setObjectSplitting(!objectSplitting)}
              sx={{
                borderRadius: "4px",
              }}
            >
              <Add />
            </ToggleButton>
          </ListItem>
          <ListItem>
            <TextField
              type="color"
              size="small"
              label="Object color"
              sx={{ width: 100 }}
              defaultValue="#000000"
            />
          </ListItem>
          <ListItem>
            <Button sx={styles.toolbarButton} startIcon={<Analytics />}>
              Run quantification analysis
            </Button>
          </ListItem>
          <ListItem>
            <Button sx={styles.toolbarButton} startIcon={<Compare />}>
              Compare segmentations to raw images
            </Button>
          </ListItem>
          <ListItem>
            <Button sx={styles.toolbarButton} startIcon={<Calculate />}>
              Get statistics
            </Button>
          </ListItem>
          <ListItem>
            <Button sx={styles.toolbarButton} startIcon={<SaveAlt />}>
              Export results
            </Button>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default Nutil;
