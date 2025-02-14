import React from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Icon,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Add from "@mui/icons-material/Add";
import FolderOffOutlinedIcon from "@mui/icons-material/FolderOffOutlined";
import mBrain from "../mBrain.ico";

const BrainList = ({ rows, onBrainSelect }) => {
  const [selectedBrain, setSelectedBrain] = React.useState(null);

  // Choose brains to fetch stats for upon click
  const handleBrainSelect = (brain) => {
    setSelectedBrain(brain);
    onBrainSelect({ row: brain });
  };

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "row",
        }}
      >
        <Icon
          component={FolderOffOutlinedIcon}
          sx={{ fontSize: 25, color: "gray", mr: 2 }}
        />
        <Typography variant="h6" color="gray" gutterBottom>
          No series were found, please add a series.
        </Typography>
      </Box>
    );
  }

  return (
    <List
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
      }}
      dense
    >
      {rows.map((brain) => (
        <ListItem
          key={brain.id}
          disablePadding
          sx={{
            borderBottom: "1px solid #e0e0e0",
            "&:last-child": { borderBottom: "none" },
          }}
        >
          <ListItemButton
            selected={selectedBrain && selectedBrain.id === brain.id}
            onClick={() => handleBrainSelect(brain)}
          >
            <ListItemIcon>
              <img
                src={mBrain}
                alt="Brain Icon"
                style={{ width: "1.75rem", height: "1.75rem" }}
              />
            </ListItemIcon>
            <ListItemText primary={brain.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

const BrainTable = ({
  selectedProject,
  rows,
  onBackClick,
  onAddBrainClick,
  onBrainSelect,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        maxWidth: "25%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        backgroundColor: "white",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
        alignContent: "flex-start",
      }}
    >
      <Typography variant="h6" color="black" gutterBottom>
        {selectedProject.name}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            size="small"
            onClick={onBackClick}
            sx={{ maxWidth: 180 }}
            startIcon={<ArrowBack />}
          >
            to Projects
          </Button>
          <Button
            size="small"
            sx={{ maxWidth: 180 }}
            startIcon={<Add />}
            onClick={onAddBrainClick}
          >
            Add/Edit Series
          </Button>
        </Box>
      </Box>
      <BrainList rows={rows} onBrainSelect={onBrainSelect} />
    </Box>
  );
};

export default BrainTable;
