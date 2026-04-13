import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItemButton, ListItemText,
  Typography, Collapse, Box, CircularProgress, Chip, Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { fetchLocaliZoomDatasets } from "../actions/kgCalls";

export const parseServiceLink = (url) => {
  try {
    const u = new URL(url);
    const series = u.searchParams.get("series") || "";
    return {
      atlas: u.searchParams.get("atlas") || "",
      series,
      dziproot: u.searchParams.get("dziproot") || "",
      transform: u.searchParams.get("transform") || "",
      name: series.split("/").pop().replace(/\.json$/i, ""),
    };
  } catch {
    return null;
  }
};

export default function KGImportDialog({ open, onClose, onSelect, token }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open || datasets.length) return;
    setLoading(true);
    setError(null);
    fetchLocaliZoomDatasets(token)
      .then((map) => setDatasets([...map.values()]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = datasets.filter(
    (d) =>
      !filter ||
      (d.shortName || d.fullName).toLowerCase().includes(filter.toLowerCase()) ||
      d.doi.includes(filter)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ style: { minHeight: "70vh" } }}>
      <DialogTitle>Import from KG Datasets</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by name or DOI…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 2 }}
        />
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && (
          <List dense disablePadding>
            {filtered.map((d) => (
              <React.Fragment key={d.doi}>
                <ListItemButton onClick={() => setExpanded(expanded === d.doi ? null : d.doi)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {d.shortName || d.fullName}
                        </Typography>
                        {d.versionIdentifier && (
                          <Chip size="small" label={d.versionIdentifier} color="default" />
                        )}
                        <Chip size="small" label={`${d.serviceLinks.length} series`} color="info" variant="outlined" />
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <a href={d.doi} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem" }}>
                          {d.doi}
                        </a>
                      </Box>
                    }
                  />
                  {expanded === d.doi ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={expanded === d.doi}>
                  <Box sx={{ pl: 3, pr: 2, pb: 2 }}>
                    {d.fullName && d.fullName !== d.shortName && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Full name:</strong> {d.fullName}
                      </Typography>
                    )}
                    {d.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: "italic" }}>
                        {d.description}
                      </Typography>
                    )}
                    {d.versionInnovation && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        <strong>What's new:</strong> {d.versionInnovation}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                      Series ({d.serviceLinks.length})
                    </Typography>
                    {d.serviceLinks.map((link, i) => {
                      const parsed = parseServiceLink(link);
                      if (!parsed) return null;
                      return (
                        <Box
                          key={i}
                          sx={{ mb: 1, p: 1, border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "#fafafa" }}
                        >
                          <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block", wordBreak: "break-all", mb: 0.5 }}>
                            <strong>{parsed.name}</strong> · {parsed.atlas}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={() => {
                              onSelect({ ...parsed, doi: d.doi, shortName: d.shortName || d.fullName });
                              onClose();
                            }}
                          >
                            Import this series
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
