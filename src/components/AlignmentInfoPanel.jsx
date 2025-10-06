import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Box,
  Divider,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const AlignmentInfoPanel = () => {
  const [alignment, setAlignment] = useState("");
  const [bucket, setBucket] = useState("");

  const [alignmentOpen, setAlignmentOpen] = useState(true);
  const [shareLinksOpen, setShareLinksOpen] = useState(false);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);

  useEffect(() => {
    // Initial load from localStorage
    setAlignment(localStorage.getItem("alignment") || "None");
    setBucket(localStorage.getItem("bucketName") || "None");

    // Optional: Listen for storage changes
    const handleStorageChange = () => {
      setAlignment(localStorage.getItem("alignment") || "None");
      setBucket(localStorage.getItem("bucketName") || "None");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 48,
        right: 80,
        width: 280,
        zIndex: 1300,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, backgroundColor: "primary.main" }}>
        <Typography
          variant="subtitle2"
          sx={{ color: "white", fontWeight: 500 }}
        >
          Workspace Info
        </Typography>
      </Box>

      <List disablePadding sx={{ maxHeight: 400, overflow: "auto" }}>
        {/* Alignment Info Section */}
        <ListItemButton
          onClick={() => setAlignmentOpen(!alignmentOpen)}
          sx={{ py: 0.75 }}
        >
          <ListItemText
            primary="Alignment Info"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 500,
            }}
          />
          {alignmentOpen ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </ListItemButton>
        <Collapse in={alignmentOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, py: 1, backgroundColor: "grey.50" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              <strong>Alignment:</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, overflowWrap: "break-word", fontSize: "0.8rem" }}
            >
              {alignment}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              <strong>Bucket:</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{ overflowWrap: "break-word", fontSize: "0.8rem" }}
            >
              {bucket}
            </Typography>
          </Box>
        </Collapse>

        <Divider />

        {/* Share Links Section */}
        <ListItemButton
          onClick={() => setShareLinksOpen(!shareLinksOpen)}
          sx={{ py: 0.75 }}
        >
          <ListItemText
            primary="Share Links"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 500,
            }}
          />
          {shareLinksOpen ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </ListItemButton>
        <Collapse in={shareLinksOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, py: 1, backgroundColor: "grey.50" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8rem" }}
            >
              Share links will appear here when available.
            </Typography>
          </Box>
        </Collapse>

        <Divider />

        {/* Placeholder Section */}
        <ListItemButton
          onClick={() => setPlaceholderOpen(!placeholderOpen)}
          sx={{ py: 0.75 }}
        >
          <ListItemText
            primary="Additional Info"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 500,
            }}
          />
          {placeholderOpen ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </ListItemButton>
        <Collapse in={placeholderOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, py: 1, backgroundColor: "grey.50" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8rem" }}
            >
              Additional information will be displayed here.
            </Typography>
          </Box>
        </Collapse>
      </List>
    </Paper>
  );
};

export default AlignmentInfoPanel;
