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
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNotification } from "../contexts/NotificationContext";

const AlignmentInfoPanel = () => {
  const { showInfo } = useNotification();
  const [alignment, setAlignment] = useState("");
  const [bucket, setBucket] = useState("");
  const [shareLinks, setShareLinks] = useState([]);

  const [alignmentOpen, setAlignmentOpen] = useState(true);
  const [shareLinksOpen, setShareLinksOpen] = useState(false);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);

  useEffect(() => {
    // Initial load from localStorage
    setAlignment(localStorage.getItem("alignment") || "None");
    setBucket(localStorage.getItem("bucketName") || "None");

    // Load share links from localStorage
    const storedLinks = localStorage.getItem("shareLinks");
    setShareLinks(storedLinks ? JSON.parse(storedLinks) : []);

    // Optional: Listen for storage changes
    const handleStorageChange = () => {
      setAlignment(localStorage.getItem("alignment") || "None");
      setBucket(localStorage.getItem("bucketName") || "None");

      const updatedLinks = localStorage.getItem("shareLinks");
      setShareLinks(updatedLinks ? JSON.parse(updatedLinks) : []);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleCopyLink = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showInfo("Link copied to clipboard!");
      })
      .catch(() => {
        showInfo("Failed to copy link");
      });
  };

  const handleDeleteLink = (index) => {
    const updatedLinks = shareLinks.filter((_, i) => i !== index);
    setShareLinks(updatedLinks);
    localStorage.setItem("shareLinks", JSON.stringify(updatedLinks));
  };

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
      <Box
        sx={{
          px: 2,
          py: 1.5,
          backgroundColor: "primary.main",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <EditNoteIcon sx={{ color: "white", fontSize: 20 }} />
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
              sx={{ textAlign: "left" }}
            >
              <strong>Alignment:</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                overflowWrap: "break-word",
                fontSize: "0.8rem",
                textAlign: "left",
              }}
            >
              {alignment}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ textAlign: "left" }}
            >
              <strong>Bucket:</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                overflowWrap: "break-word",
                fontSize: "0.8rem",
                textAlign: "left",
              }}
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
            {shareLinks.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                No share links saved yet.
              </Typography>
            ) : (
              <List disablePadding>
                {shareLinks.map((link, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      mb: 1,
                      pb: 1,
                      borderBottom:
                        index < shareLinks.length - 1
                          ? "1px solid #e0e0e0"
                          : "none",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontSize: "0.75rem",
                        wordBreak: "break-all",
                        textAlign: "left",
                        mr: 1,
                      }}
                    >
                      {link.name || `Link ${index + 1}`}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Copy link">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyLink(link.url)}
                          sx={{ padding: 0.5 }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete link">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLink(index)}
                          sx={{ padding: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </List>
            )}
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
              sx={{ fontSize: "0.8rem", textAlign: "left" }}
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
