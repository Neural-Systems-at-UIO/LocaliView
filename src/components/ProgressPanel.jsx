import logger from "../utils/logger.js";
import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Tooltip,
  Button,
  CircularProgress,
} from "@mui/material";

import { useTabContext } from "../contexts/TabContext";

// Icons
import ImageIcon from "@mui/icons-material/Image";
import MapIcon from "@mui/icons-material/Map";
import ArrowOutward from "@mui/icons-material/ArrowOutward";

// This is the main atlas name dispalyed on top of the panel as waln containts the abbrev.
const atlasNames = {
  WHS_SD_Rat_v3_39um: "Waxholm Space Atlas of the Sprague Dawley rat v3",
  WHS_SD_Rat_v4_39um: "Waxholm Space Atlas of the Sprague Dawley rat v4",
  ABA_Mouse_CCFv3_2017_25um: "Allen Mouse Brain Atlas CCFv3 2017 25um",
  // More atlases later on maybe
};

// TODO - Get the vanilla atlas screen from QuickActions to here

// Progress Card colors
const meshviewColor = {
  button: "rgba(224, 68, 146, 1)",
  background: "rgba(224, 68, 146, 0.1)",
};
const localizoomColor = {
  button: "rgba(247, 125, 59, 1)",
  background: "rgba(247, 125, 59, 0.1)",
};

export default function ProgressPanel({
  walnContent,
  currentRegistration,
  // The two following are not relevant
  segmented,
  nutilResults,
  token,
}) {
  const {
    navigateToWebAlign,
    navigateToWebWarp,
    navigateToWebIlastik,
    navigateToWebNutil,
    navigateToLocaliZoom,
    navigateToMeshView,
  } = useTabContext();

  if (!walnContent) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
        <Typography variant="body2" color="text.secondary"></Typography>
      </Box>
    );
  }

  // Helpers for getting the WALN content
  const sectionList = walnContent?.sections || walnContent?.slices || [];
  const totalImages = sectionList.length;

  // Calculate sections/slices with OUV/anchoring and markers
  const sectionsWithOUVorAnchoring = sectionList.filter(
    (item) =>
      (item?.ouv && item.ouv.length > 0) ||
      (item?.anchoring && item.anchoring.length > 0)
  ).length;
  const sectionsWithMarkers = sectionList.filter(
    (item) => item?.markers && item.markers.length > 0
  ).length;

  // Verbose logging
  logger.debug("ProgressPanel metrics", {
    totalImages,
    sectionsWithOUVorAnchoring,
    sectionsWithMarkers,
  });

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        backgroundColor: "white",
        border: "1px solid #e0e0e0",
        borderRadius: "4px",
        boxShadow: "none",
        mt: 1,
      }}
    >
      <Stack spacing={2}>
        {/* Header with Atlas and Image Count 
        
        - Initial info, later down will reveal the progress
        
        
        */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <MapIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" color="primary" noWrap>
              {atlasNames[walnContent.atlas]}
            </Typography>
          </Stack>
          <Tooltip title="Total brain sections">
            <Chip
              size="small"
              icon={<ImageIcon sx={{ fontSize: 14 }} />}
              label={totalImages}
              variant="filled"
              sx={{ height: 24, p: 1 }}
            />
          </Tooltip>
        </Stack>

        <Stack spacing={1} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            {/* WebAlign Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(25, 118, 210, 0.05)",
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8 }}
                      color="primary.main"
                    >
                      Register
                    </Typography>
                  </Box>
                  <Tooltip
                    title={`${sectionsWithOUVorAnchoring} sections with OUV data`}
                  >
                    <Chip
                      label={`${sectionsWithOUVorAnchoring}/${totalImages}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Tooltip>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={(sectionsWithOUVorAnchoring / totalImages) * 100}
                      size={60}
                      thickness={2.5}
                      sx={{ color: "primary.main" }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {Math.round(
                          (sectionsWithOUVorAnchoring / totalImages) * 100
                        )}
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={() => navigateToWebAlign(currentRegistration)}
                  disabled={
                    !walnContent || sectionsWithOUVorAnchoring === totalImages
                  }
                  sx={{ fontSize: "0.8rem", mt: 0.5, textTransform: "none" }}
                  fullWidth
                  className="glass-button"
                >
                  Continue in WebAlign
                </Button>
              </Stack>
            </Paper>

            {/* WebWarp Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(46, 125, 50, 0.05)",
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8 }}
                      color="success.main"
                    >
                      Refine
                    </Typography>
                  </Box>
                  <Tooltip
                    title={`${sectionsWithMarkers} sections with markers`}
                  >
                    <Chip
                      label={`${sectionsWithMarkers}/${totalImages}`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Tooltip>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={(sectionsWithMarkers / totalImages) * 100}
                      size={60}
                      thickness={2.5}
                      sx={{ color: "success.main" }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="success.main"
                        fontWeight="bold"
                      >
                        {Math.round((sectionsWithMarkers / totalImages) * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={() => navigateToWebWarp(currentRegistration)}
                  color="success"
                  className="glass-button"
                  sx={{ fontSize: "0.8rem", mt: 0.5, textTransform: "none" }}
                  fullWidth
                >
                  Continue in WebWarp
                </Button>
              </Stack>
            </Paper>

            {/* LocaliZoom Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: localizoomColor.background,
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8, color: localizoomColor.button }}
                    >
                      Localize
                    </Typography>
                  </Box>
                  <Tooltip title="LocaliZoom for annotation">
                    <Chip
                      label="Ready"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 22,
                        borderColor: localizoomColor.button,
                        color: localizoomColor.button,
                      }}
                    />
                  </Tooltip>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={0}
                      size={60}
                      thickness={2.5}
                      sx={{ color: localizoomColor.button }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: localizoomColor.button }}
                        fontWeight="bold"
                      >
                        Annotation ready
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={() => navigateToLocaliZoom(token)}
                  className="glass-button"
                  sx={{
                    fontSize: "0.8rem",
                    mt: 0.5,
                    textTransform: "none",
                    backgroundColor: localizoomColor.button,
                    "&:hover": {
                      backgroundColor: localizoomColor.button,
                    },
                  }}
                  fullWidth
                >
                  Continue in LocaliZoom
                </Button>
              </Stack>
            </Paper>

            {/* MeshView Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: meshviewColor.background,
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8, color: meshviewColor.button }}
                    >
                      Visualize
                    </Typography>
                  </Box>
                  <Tooltip title="MeshView for 3D visualization">
                    <Chip
                      label="Ready"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 22,
                        borderColor: meshviewColor.button,
                        color: meshviewColor.button,
                      }}
                    />
                  </Tooltip>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={0}
                      size={60}
                      thickness={2.5}
                      sx={{ color: meshviewColor.button }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: meshviewColor.button }}
                        fontWeight="bold"
                      >
                        View 3D
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={navigateToMeshView}
                  className="glass-button"
                  sx={{
                    fontSize: "0.8rem",
                    mt: 0.5,
                    textTransform: "none",
                    backgroundColor: meshviewColor.button,
                    "&:hover": {
                      backgroundColor: meshviewColor.button,
                    },
                  }}
                  fullWidth
                >
                  Continue in MeshView
                </Button>
              </Stack>
            </Paper>

            {/* WebIlastik Card - COMMENTED OUT (not available in current tabs)
            The info for this section is available via the segments function
            */}
            {/*<Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(184, 110, 20, 0.05)",
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8 }}
                      color="warning.main"
                    >
                      Extract
                    </Typography>
                  </Box>
                  <Tooltip title={`WebIlastik tooltip`}>
                    <Chip
                      label={`${segmented}/${totalImages}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Tooltip>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={Math.min((segmented / totalImages) * 100, 100)}
                      size={60}
                      thickness={2.5}
                      color="warning"
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="warning"
                        fontWeight="bold"
                      >
                        {Math.min((segmented / totalImages) * 100, 100).toFixed(
                          2
                        )}
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  className="glass-button"
                  disableElevation
                  onClick={navigateToWebIlastik}
                  color="warning"
                  sx={{
                    fontSize: "0.8rem",
                    mt: 0.5,
                    textTransform: "none",
                  }}
                  fullWidth
                >
                  Continue in WebIlastik
                </Button>
              </Stack>
            </Paper>*/}

            {/* WebNutil - COMMENTED OUT (not available in current tabs)
            integrity is verified via the csv/other type of result presence WIP */}
            {/*<Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(25, 118, 210, 0.05)",
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ ml: 0.8 }}
                      color="secondary.main"
                    >
                      Quantify
                    </Typography>
                  </Box>
                  {/*<Tooltip title={`Pynutil tooltip`}>
                    <Chip
                      label={`?`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Tooltip>
                  */
            /*}
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 1,
                  }}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={0}
                      size={60}
                      thickness={2.5}
                      sx={{ color: "warning" }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="secondary"
                        fontWeight="bold"
                      >
                        {nutilResults?.length} results ready
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={navigateToWebNutil}
                  color="secondary"
                  sx={{
                    fontSize: "0.8rem",
                    mt: 0.5,
                    textTransform: "none",
                  }}
                  className="glass-button"
                  fullWidth
                >
                  Continue in WebNutil
                </Button>
              </Stack>
            </Paper>*/}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
