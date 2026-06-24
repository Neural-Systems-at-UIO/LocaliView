import logger from "../utils/logger.js";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Box,
  Autocomplete,
  LinearProgress,
  Chip,
  Typography,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import { uploadToPath, uploadToJson } from "../actions/handleCollabs";
import { useNotification } from "../contexts/NotificationContext";
import UploadZone from "./UploadZone";
import KGImportDialog from "./KGImportDialog";

export default function CreationDialog({
  open,
  onClose,
  project,
  token,
  brainEntries,
  onUploadComplete,
}) {
  const { showError, showWarning, showSuccess } = useNotification();
  const [name, setName] = useState("");
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [editBrainsList, setEditBrainsList] = useState([]);

  // For upload feedback of images to series
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // KG import mode
  const [kgDialogOpen, setKgDialogOpen] = useState(false);
  const [kgData, setKgData] = useState(null); // parsed KG series

  useEffect(() => {
    if (brainEntries) {
      const editBrains = brainEntries.map((entry) => entry.name);
      setEditBrainsList(editBrains);
      logger.debug("Edit brains list", { count: editBrains?.length });
    }
  }, [brainEntries]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes fully otherwise stuck with the old uploads
      setFilesToUpload([]);
      setName("");
      setUploadProgress(0);
      setKgData(null);
    }
  }, [open]);

  const handleKGSelect = (parsed) => {
    setKgData(parsed);
    setName(parsed.name);
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  // Allow user to unselect files
  const handleFilesSelected = (files) => {
    setFilesToUpload(files);
  };

  const uploadFiles = async () => {
    const collabName = localStorage.getItem("bucketName");
    setIsUploading(true);
    setUploadProgress(0);

    if (filesToUpload.length > 0) {
      try {
        let completedUploads = 0;
        const batchSize = 4; // Process 4 files at a time
        const allResults = [];

        // Process files in batches of 4
        for (let i = 0; i < filesToUpload.length; i += batchSize) {
          // Get the current batch of files
          const batch = filesToUpload.slice(i, i + batchSize);

          // Upload this batch in parallel
          const batchPromises = batch.map((file) =>
            uploadToPath(
              token,
              collabName,
              project.name,
              name + "/raw_images/",
              file
            ).then((result) => {
              // Increment completed count and update progress
              completedUploads++;
              setUploadProgress(
                (completedUploads / filesToUpload.length) * 100
              );
              return { ...result, originalFile: file };
            })
          );

          // Wait for current batch to complete before moving to next batch
          const batchResults = await Promise.all(batchPromises);
          allResults.push(...batchResults);
        }

        setIsUploading(false);
        showSuccess("Files uploaded successfully");
        return allResults;
      } catch (error) {
        setIsUploading(false);
        logger.error("Error uploading files", error);
        showError("Error uploading files");
        throw error;
      }
    }
    setIsUploading(false);
    return [];
  };

  const handleSubmit = async () => {
    if (!name || name.trim() === "") {
      showError("An image series name is required");
      return;
    }

    if (kgData) {
      // KG import mode: fetch the series JSON from the service link and store it
      const collabName = localStorage.getItem("bucketName");
      setIsUploading(true);
      try {
        if (!kgData.series) {
          throw new Error("No series URL found in KG data");
        }
        const seriesFileName = kgData.series.split("/").pop();
        const seriesUrl = new URL(kgData.series);
        seriesUrl.searchParams.set("redirect", "false");
        const redirectResp = await fetch(seriesUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!redirectResp.ok) {
          throw new Error(`Failed to resolve series URL: ${redirectResp.status}`);
        }
        const { url: downloadUrl } = await redirectResp.json();
        if (!downloadUrl) {
          throw new Error("No download URL returned from series endpoint");
        }
        const seriesResp = await fetch(downloadUrl);
        if (!seriesResp.ok) {
          throw new Error(`Failed to fetch series JSON: ${seriesResp.status}`);
        }
        const seriesContent = await seriesResp.json();
        // dziproot/bucket will be resolved below after parsing the URL into extBucket + prefix
        // Inject atlas if the series JSON doesn't already carry it
        if (kgData.atlas && !seriesContent.atlas) {
          seriesContent.atlas = kgData.atlas;
        }
        // AP1+AP2: Normalize slices→sections, rename anchoring→ouv, remove redundant slices field
        if (!seriesContent.sections && Array.isArray(seriesContent.slices)) {
          seriesContent.sections = seriesContent.slices;
          console.log("[KG import] Copied slices → sections:", seriesContent.sections.length, "entries");
        }
        // Rename anchoring → ouv: LZ descriptor uses 'anchoring', WebAlign/WebWarp expect 'ouv'
        const renameAnchoringToOuv = (section) => {
          if (!section || typeof section !== "object") return section;
          if ("anchoring" in section && !("ouv" in section)) {
            const { anchoring, ...rest } = section;
            return { ...rest, ouv: anchoring };
          }
          return section;
        };
        if (Array.isArray(seriesContent.sections)) {
          const anchorCount = seriesContent.sections.filter((s) => "anchoring" in s).length;
          seriesContent.sections = seriesContent.sections.map(renameAnchoringToOuv);
          console.log(`[KG import] anchoring→ouv: renamed ${anchorCount} / ${seriesContent.sections.length} sections`);
        }
        // Remove redundant 'slices' field — it was copied to 'sections' above
        if (seriesContent.slices) {
          delete seriesContent.slices;
          console.log("[KG import] Removed redundant 'slices' field from descriptor");
        }

        // AP3+AP4+AP5: Detect DZIP vs uncompressed layout; rewrite filenames or set bucket field
        if (kgData.dziproot) {
          const DATA_PROXY_BASE = "https://data-proxy.ebrains.eu/api/v1/buckets/";
          // Parse the dziproot URL robustly: supports both
          //   /api/v1/buckets/{bucketId}/[prefix]  (pyramids= style)
          //   /api/v1/{bucketId}/[prefix]           (imgsvc- / dziproot= style)
          let extBucket, prefix;
          try {
            const dzu = new URL(kgData.dziproot);
            const segments = dzu.pathname.split("/").filter(Boolean);
            const v1Idx = segments.indexOf("v1");
            const afterV1 = v1Idx >= 0 ? segments.slice(v1Idx + 1) : segments;
            if (afterV1[0] === "buckets") {
              extBucket = afterV1[1];
              const prefixParts = afterV1.slice(2);
              prefix = prefixParts.length ? prefixParts.join("/") + "/" : "";
            } else {
              extBucket = afterV1[0];
              const prefixParts = afterV1.slice(1);
              prefix = prefixParts.length ? prefixParts.join("/") + "/" : "";
            }
          } catch (_) {
            // Fallback: original slice logic for unexpected URL shapes
            const stripped = kgData.dziproot.replace(/\/$/, "").slice(DATA_PROXY_BASE.length);
            const slashIdx = stripped.indexOf("/");
            extBucket = slashIdx === -1 ? stripped : stripped.slice(0, slashIdx);
            prefix = slashIdx === -1 ? "" : stripped.slice(slashIdx + 1) + "/";
          }
          console.log(`[KG import] Parsed dziproot → bucket="${extBucket}" prefix="${prefix}"`);
          let bucketObjects = [];
          let bucketFileSet = new Set();
          try {
            const listUrl = prefix
              ? `${DATA_PROXY_BASE}${extBucket}?prefix=${encodeURIComponent(prefix)}&limit=5000`
              : `${DATA_PROXY_BASE}${extBucket}?limit=5000`;
            console.log("[KG import] Listing pyramid bucket:", listUrl);
            // Send auth header — imgsvc- buckets require it; img- buckets tolerate it
            const listResp = await fetch(listUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (listResp.ok) {
              const listData = await listResp.json();
              bucketObjects = listData.objects || [];
              bucketObjects.forEach((o) => {
                const base = o.name.split("/").pop();
                bucketFileSet.add(base);
              });
              console.log(
                `[KG import] Bucket has ${bucketObjects.length} objects, sample:`,
                bucketObjects.slice(0, 3).map((o) => o.name),
              );
            } else {
              console.warn(`[KG import] Bucket listing returned ${listResp.status} — falling back to name heuristic`);
            }
          } catch (e) {
            logger.warn("[KG import] Could not fetch pyramid bucket listing", e);
          }

          // Detect layout:
          //   1. Any .dzip in listing → compressed
          //   2. Listing empty/failed but bucket name starts with imgsvc- → also compressed
          //      (imgsvc- is exclusively used for DZIP compressed storage on EBRAINS)
          //   3. Otherwise → old uncompressed pyramid directories (img- buckets)
          const isDzip = bucketObjects.some((o) => o.name.endsWith(".dzip"))
            || (bucketObjects.length === 0 && extBucket.includes("imgsvc-"));
          console.log(
            `[KG import] Pyramid layout: ${isDzip ? "DZIP (compressed)" : "uncompressed directories"}`,
            `(listing had ${bucketObjects.length} objects, bucket="${extBucket}")`,
          );

          if (isDzip) {
            // --- DZIP path (existing behaviour) ---
            const transformRule = kgData.transform || null;            const toDzipFilename = (filename) => {
              if (!filename) return filename;
              if (bucketFileSet.size > 0 && bucketFileSet.has(filename.split("/").pop())) return filename;
              if (transformRule) {
                const eqIdx = transformRule.indexOf("=");
                if (eqIdx !== -1) {
                  const from = transformRule.slice(0, eqIdx);
                  const to = transformRule.slice(eqIdx + 1);
                  if (filename.endsWith(from)) {
                    const candidate = filename.slice(0, -from.length) + to;
                    if (bucketFileSet.size === 0 || bucketFileSet.has(candidate.split("/").pop())) return candidate;
                  }
                }
              }
              if (!filename.endsWith(".dzip")) {
                const candidate = filename + ".dzip";
                if (bucketFileSet.size === 0 || bucketFileSet.has(candidate.split("/").pop())) return candidate;
              }
              return filename;
            };
            const normalizeSections = (arr) =>
              Array.isArray(arr)
                ? arr.map((s) => (s.filename ? { ...s, filename: toDzipFilename(s.filename) } : s))
                : arr;
            if (Array.isArray(seriesContent.sections)) {
              seriesContent.sections = normalizeSections(seriesContent.sections);
              console.log(
                "[KG import] Rewrote section filenames to .dzip, sample:",
                seriesContent.sections.slice(0, 2).map((s) => s.filename),
              );
            }
            // Store dziproot as a full data-proxy URL so the DZIP detection in QuintTable
            // (walnContent.dziproot.startsWith("http")) continues to work.
            // Do NOT set seriesContent.bucket for DZIP — that field is the uncompressed marker.
            const DATA_PROXY_BASE_STORE = "https://data-proxy.ebrains.eu/api/v1/buckets/";
            seriesContent.dziproot = `${DATA_PROXY_BASE_STORE}${extBucket}/${prefix}`.replace(/\/+$/, "/");
            delete seriesContent.bucket;
            logger.info(`[KG import] DZIP series JSON will store: dziproot="${seriesContent.dziproot}" sections=${seriesContent.sections?.length ?? 0}`);
          } else {
            // --- AP3: Uncompressed path ---
            // Store the bare bucket name and relative prefix; WebAlign/WebWarp use these to build tile URLs.
            seriesContent.bucket = extBucket;
            seriesContent.dziproot = prefix;
            logger.info(`[KG import] Uncompressed series JSON will store: bucket="${extBucket}" dziproot="${prefix}" sections=${seriesContent.sections?.length ?? 0}`);

            // AP5: Fetch DZI XML for each section to inject format/tilesize/overlap metadata.
            // imgsvc- buckets use /api/v1/imgsvc-xxx/ not /api/v1/buckets/imgsvc-xxx/ —
            // build all redirect URLs from kgData.dziproot to avoid the scheme mismatch.
            const parseDziXml = (xml) => ({
              format: (xml.match(/Format="([^"]+)"/m) || [])[1] || null,
              tilesize: parseInt((xml.match(/TileSize="(\d+)"/m) || [])[1], 10) || null,
              overlap: parseInt((xml.match(/Overlap="(\d+)"/m) || [])[1], 10) || null,
            });

            const fetchDziXml = async (baseName) => {
              // DZI sits inside the image directory, named without the file extension:
              //   D1R_s001.tif  →  {dziproot}D1R_s001.tif/D1R_s001.dzi
              // Use kgData.dziproot directly as the base — it already contains the correct
              // scheme (/api/v1/imgsvc-xxx/ or /api/v1/buckets/xxx/prefix/) so we don't
              // re-introduce a /api/v1/buckets/ mismatch for imgsvc- style buckets.
              const dziStem = baseName.replace(/\.[^.]+$/, "");
              const dzipBase = kgData.dziproot.replace(/\/$/, "");
              const redirectUrl = `${dzipBase}/${baseName}/${dziStem}.dzi?redirect=false`;
              console.log(`[KG import] Fetching DZI (redirect): ${redirectUrl}`);
              // Step 1 – resolve signed URL
              const redirectResp = await fetch(redirectUrl, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!redirectResp.ok) throw new Error(`redirect HTTP ${redirectResp.status}`);
              const { url: signedUrl } = await redirectResp.json();
              if (!signedUrl) throw new Error("No signed URL returned");
              // Step 2 – fetch actual XML
              const xmlResp = await fetch(signedUrl);
              if (!xmlResp.ok) throw new Error(`XML HTTP ${xmlResp.status}`);
              return xmlResp.text();
            };

            let dziOk = 0;
            let dziFail = 0;
            const sections = seriesContent.sections || [];
            console.log(`[KG import] Fetching DZI XML for ${sections.length} sections…`);
            const enrichedSections = await Promise.all(
              sections.map(async (section) => {
                if (!section.filename) return section;
                const baseName = section.filename.split("/").pop();
                try {
                  const dziText = await fetchDziXml(baseName);
                  const { format, tilesize, overlap } = parseDziXml(dziText);
                  console.log(`[KG import] DZI ok for ${baseName}: format=${format} tilesize=${tilesize} overlap=${overlap}`);
                  dziOk++;
                  return {
                    ...section,
                    ...(format != null ? { format } : {}),
                    ...(tilesize != null ? { tilesize } : {}),
                    ...(overlap != null ? { overlap } : {}),
                  };
                } catch (e) {
                  dziFail++;
                  logger.warn(`[KG import] Could not fetch DZI XML for ${baseName}: ${e.message}`);
                  return section;
                }
              }),
            );
            seriesContent.sections = enrichedSections;
            console.log(`[KG import] DZI metadata enrichment: ${dziOk} ok, ${dziFail} failed`);
          }
        }
        await uploadToJson(
          { token, bucketName: collabName, projectName: project.name, brainName: name },
          seriesFileName,
          seriesContent
        );
        showSuccess("KG series imported successfully");
        onUploadComplete?.();
        onClose();
      } catch (error) {
        logger.error("Error importing KG series", error);
        showError("Failed to import KG series");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (filesToUpload.length === 0) {
      showWarning("Please select files to upload");
      return;
    }

    try {
      await uploadFiles();
      onUploadComplete?.();
      onClose();
    } catch (error) {
      logger.error("Error in handleSubmit", error);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { minHeight: "80vh" } }}
      >
        <DialogTitle>
          Upload an image series in {project?.name || ""}
        </DialogTitle>
        <DialogContent sx={{ padding: "20px" }}>
          <DialogContentText sx={{ marginBottom: "20px" }}>
            Enter the name of the series, or click on already created serie,
            upload files, choose and click submit.
          </DialogContentText>
          <Autocomplete
            freeSolo
            id="brain-name-combo"
            options={editBrainsList}
            value={name}
            onChange={(event, newValue) => {
              // Agnostic replace to handle both selection from dropdown and manual entry
              if (newValue) {
                handleNameChange({ target: { value: newValue } });
              }
            }}
            onInputChange={(event, newValue) => {
              handleNameChange({ target: { value: newValue } });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label="Name"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
              />
            )}
            sx={{
              "& .MuiAutocomplete-listbox": {
                "&::-webkit-scrollbar": {
                  height: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#bbb",
                  borderRadius: "4px",
                },
              },
            }}
          />

          {kgData ? (
            <Box sx={{ border: "1px solid", borderColor: "info.main", borderRadius: 1, p: 2, bgcolor: "#e8f4fd" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <StorageIcon fontSize="small" color="info" />
                <Chip label="KG Dataset" color="info" size="small" />
                <Button size="small" onClick={() => { setKgData(null); setName(""); }}>Clear</Button>
              </Box>
              <Typography variant="body2"><strong>Atlas:</strong> {kgData.atlas}</Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}><strong>Series:</strong> {kgData.series}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{kgData.doi}</Typography>
            </Box>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<StorageIcon />}
                onClick={() => setKgDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Import from KG Datasets
              </Button>
              <UploadZone onFilesSelected={handleFilesSelected} />
            </>
          )}
          {isUploading && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <DialogContentText className="loading-shine" sx={{ mb: 1 }}>
                {kgData ? "Importing..." : `Uploading: ${Math.round(uploadProgress)}%`}
              </DialogContentText>
              {!kgData && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "20px" }}>
          <Button onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (kgData ? "Importing..." : "Uploading...") : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
      <KGImportDialog
        open={kgDialogOpen}
        onClose={() => setKgDialogOpen(false)}
        onSelect={handleKGSelect}
        token={token}
      />
    </>
  );
}
