import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  List,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNotification } from "../contexts/NotificationContext";

const AlignmentInfoPanel = () => {
  const { showInfo } = useNotification();
  const [shareLinks, setShareLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shareLinks") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        setShareLinks(JSON.parse(localStorage.getItem("shareLinks") || "[]"));
      } catch {
        setShareLinks([]);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleCopyLink = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => showInfo("Link copied to clipboard!"))
      .catch(() => showInfo("Failed to copy link"));
  };

  const handleDeleteLink = (index) => {
    const updated = shareLinks.filter((_, i) => i !== index);
    setShareLinks(updated);
    localStorage.setItem("shareLinks", JSON.stringify(updated));
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 48,
        right: 80,
        width: 300,
        zIndex: 1300,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          backgroundColor: "primary.main",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <LinkIcon sx={{ color: "white", fontSize: 18 }} />
        <Typography
          variant="subtitle2"
          sx={{ color: "white", fontWeight: 600 }}
        >
          Share Links
        </Typography>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: "grey.50",
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {shareLinks.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.8rem" }}
          >
            No share links yet. Use the bookmark icon in the Progress Panel to
            save a MeshView link.
          </Typography>
        ) : (
          <List disablePadding>
            {shareLinks.map((link, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 1,
                  pb: 1,
                  borderBottom:
                    index < shareLinks.length - 1
                      ? "1px solid #e0e0e0"
                      : "none",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.75rem", fontWeight: 500, mb: 0.2 }}
                  >
                    {link.name || `Link ${index + 1}`}
                  </Typography>
                  {link.createdAt && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      {new Date(link.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{ display: "flex", gap: 0.25, flexShrink: 0, ml: 0.5 }}
                >
                  <Tooltip title="Copy link">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyLink(link.url)}
                      sx={{ p: 0.4 }}
                    >
                      <ContentCopyIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteLink(index)}
                      sx={{ p: 0.4, "&:hover": { color: "error.main" } }}
                    >
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default AlignmentInfoPanel;
