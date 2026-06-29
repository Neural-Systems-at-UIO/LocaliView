import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItemButton, ListItemText,
  Typography, Collapse, Box, CircularProgress, Chip, Divider, Tooltip, Switch, FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { fetchLocaliZoomDatasets } from "../actions/kgCalls";

// Atlases that LocaliView's WebAlign / WebWarp actually support
const SUPPORTED_ATLASES = new Set([
  // WHS Rat v2 — appears in LZ URLs as both the short code and the full name
  "WHS_SD_Rat_v2_39um",
  "Waxholm Space Atlas of the Sprague Dawley rat v2",
  // WHS Rat v3
  "WHS_SD_Rat_v3_39um",
  // WHS Rat v4
  "WHS_SD_Rat_v4_39um",
  // Allen Mouse CCFv3 2017
  "ABA_Mouse_CCFv3_2017_25um",
  // Allen Mouse 2015
  "Allen Mouse Brain Atlas version 3 2015",
]);

// A series is considered DZIP-compressed if it has a pyramid/dziproot bucket.
// Bucket naming changed from imgsvc- to img- — accept both.
const isDzipSeries = (parsed) => {
  if (!parsed?.dziproot) return false;
  return parsed.dziproot.includes("imgsvc-") || parsed.dziproot.includes("img-");
};

const isCompatibleSeries = (link) => {
  const parsed = parseServiceLink(link);
  if (!parsed) return false;
  return SUPPORTED_ATLASES.has(parsed.atlas) && isDzipSeries(parsed);
};

const DATA_PROXY_BUCKETS = "https://data-proxy.ebrains.eu/api/v1/buckets/";

/** Normalise a series/dziproot/pyramids value that may be either a full URL or a bare
 *  bucket path (new KG naming: img-xxx/path or img-xxx). Returns a full data-proxy URL. */
const toDataProxyUrl = (value, trailingSlash = false) => {
  if (!value) return "";
  try {
    // Already a full URL — return as-is (optionally ensure trailing slash)
    new URL(value);
    return trailingSlash ? value.replace(/\/?$/, "/") : value;
  } catch {
    // Bare path: bucket[/prefix[/...]] → full data-proxy URL
    const normalised = value.replace(/^\/?/, "").replace(/\/$/, "");
    return DATA_PROXY_BUCKETS + normalised + (trailingSlash ? "/" : "");
  }
};

export const parseServiceLink = (url) => {
  try {
    const u = new URL(url);
    const rawSeries = u.searchParams.get("series") || "";

    // series may now be a bare path (new KG naming) — convert to full data-proxy URL
    const series = toDataProxyUrl(rawSeries);

    // Prefer explicit dziproot param; fall back to pyramids, BOTH Are handled here for the folers themselves as well
    let dziproot = toDataProxyUrl(u.searchParams.get("dziproot") || "", true);
    if (!dziproot) {
      const pyramids = u.searchParams.get("pyramids") || "";
      if (pyramids) {
        // Old format: "buckets/bucket-id[/prefix]"  New format: "bucket-id[/prefix]"
        const hasBucketsPrefix = pyramids.startsWith("buckets/");
        const path = hasBucketsPrefix ? pyramids : "buckets/" + pyramids.replace(/\/$/, "");
        dziproot = "https://data-proxy.ebrains.eu/api/v1/" + path.replace(/\/$/, "") + "/";
      }
    }

    return {
      atlas: u.searchParams.get("atlas") || "",
      series,
      dziproot,
      transform: u.searchParams.get("transform") || "",
      name: rawSeries.split("/").pop().replace(/\.wlan$/i, ""),
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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!open || datasets.length) return;
    setLoading(true);
    setError(null);
    fetchLocaliZoomDatasets(token)
      .then((map) => setDatasets([...map.values()]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = datasets
    .filter((d) => showAll || d.serviceLinks.some(isCompatibleSeries))
    .filter(
      (d) =>
        !filter ||
        (d.shortName || d.fullName).toLowerCase().includes(filter.toLowerCase()) ||
        d.doi.includes(filter),
    );

  const hiddenCount = datasets.filter((d) => !d.serviceLinks.some(isCompatibleSeries)).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ style: { minHeight: "70vh" } }}>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <span>Import from KG Datasets</span>
          <Tooltip title="When on, only shows datasets with a supported atlas (WHS Rat / Allen Mouse) and compressed (DZIP) images">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!showAll}
                  onChange={(e) => setShowAll(!e.target.checked)}
                />
              }
              label={
                <Typography variant="caption">
                  Compatible only{!showAll && hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}
                </Typography>
              }
              labelPlacement="start"
              sx={{ mr: 0, ml: 0 }}
            />
          </Tooltip>
        </Box>
      </DialogTitle>
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
                      const atlasOk = SUPPORTED_ATLASES.has(parsed.atlas);
                      const dzipOk = isDzipSeries(parsed);
                      const compatible = atlasOk && dzipOk;
                      if (!showAll && !compatible) return null;
                      const incompatibleReason = !atlasOk
                        ? "Atlas not supported by LocaliView"
                        : !dzipOk
                        ? "Images are uncompressed (not DZIP) — import not supported"
                        : null;
                      return (
                        <Box
                          key={i}
                          sx={{ mb: 1, p: 1, border: "1px solid", borderColor: compatible ? "#e0e0e0" : "warning.light", borderRadius: 1, bgcolor: compatible ? "#fafafa" : "#fffbf0" }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, flexWrap: "wrap" }}>
                            <Typography variant="caption" sx={{ fontFamily: "monospace", wordBreak: "break-all", flexGrow: 1 }}>
                              <strong>{parsed.name}</strong> · {parsed.atlas}
                            </Typography>
                            {!atlasOk && <Chip size="small" label="Unsupported atlas" color="warning" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />}
                            {atlasOk && !dzipOk && <Chip size="small" label="Uncompressed" color="warning" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />}
                          </Box>
                          <Tooltip title={incompatibleReason || ""}>
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                color={compatible ? "info" : "warning"}
                                disabled={!compatible}
                                onClick={() => {
                                  onSelect({ ...parsed, doi: d.doi, shortName: d.shortName || d.fullName });
                                  onClose();
                                }}
                              >
                                {compatible ? "Import this series" : "Not importable"}
                              </Button>
                            </span>
                          </Tooltip>
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
