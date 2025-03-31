import * as React from "react";
import { useState, useEffect } from "react";
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

import { useTabContext } from "./TabContext";

// Icons
import ImageIcon from "@mui/icons-material/Image";
import MapIcon from "@mui/icons-material/Map";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import ArrowOutward from "@mui/icons-material/ArrowOutward";

// This is the main atlas name dispalyed on top of the panel as waln containts the abbrev.
const atlasNames = {
  WHS_SD_Rat_v3_39um: "Waxholm Space Atlas of the Sprague Dawley rat v3",
  WHS_SD_Rat_v4_39um: "Waxholm Space Atlas of the Sprague Dawley rat v4",
  ABA_Mouse_CCFv3_2017_25um: "Allen Mouse Brain Atlas CCFv3 2017 25um",
  // More atlases later on maybe
};

// TODO - Get the vanilla atlas screen from QuickActions to here

export default function ProgressPanel({ walnContent }) {
  const {
    navigateToWebAlign,
    navigateToWebWarp,
    navigateToWebIlastik,
    navigateToWebNutil,
  } = useTabContext();

  if (!walnContent) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
        <Typography variant="body2" color="text.secondary"></Typography>
      </Box>
    );
  }

  // Helpers for getting the WALN content
  const totalImages = walnContent.sections.length;
  const avgDims = `${Math.round(
    walnContent.sections.reduce((acc, section) => acc + section.width, 0) /
      totalImages
  )}×${Math.round(
    walnContent.sections.reduce((acc, section) => acc + section.height, 0) /
      totalImages
  )}px`;

  // Calculate sections with OUV and markers
  const sectionsWithOUV = walnContent.sections.filter(
    (section) => section.ouv && section.ouv.length > 0
  ).length;
  const sectionsWithMarkers = walnContent.sections.filter(
    (section) => section.markers && section.markers.length > 0
  ).length;

  // Verbose logging
  console.log("total images", totalImages);
  console.log("sections with OUV", sectionsWithOUV);
  console.log("sections with markers", sectionsWithMarkers);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        backgroundColor: "white",
        border: "1px solid #e0e0e0",
        borderRadius: "4px",
        boxShadow: "none",
        mt: 2,
      }}
    >
      <Stack spacing={2}>
        {/* Header with Atlas and Image Count 
        
        - Initial info, later down will reveal the progress
        
        */}
        <Stack
          direction="row"
          spacing={1.5}
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

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            pt: 0.5,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AspectRatioIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {avgDims}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <FolderZipIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {walnContent.sections[0].format}
            </Typography>
          </Stack>
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
                      WebAlign
                    </Typography>
                  </Box>
                  <Tooltip title={`${sectionsWithOUV} sections with OUV data`}>
                    <Chip
                      label={`${sectionsWithOUV}/${totalImages}`}
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
                      value={(sectionsWithOUV / totalImages) * 100}
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
                        {Math.round((sectionsWithOUV / totalImages) * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
                  disableElevation
                  onClick={navigateToWebAlign}
                  disabled={!walnContent || sectionsWithOUV === totalImages}
                  sx={{ fontSize: "0.8rem", mt: 0.5, textTransform: "none" }}
                  fullWidth
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
                      WebWarp
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
                  onClick={navigateToWebWarp}
                  color="success"
                  sx={{ fontSize: "0.8rem", mt: 0.5, textTransform: "none" }}
                  fullWidth
                >
                  Continue in WebWarp
                </Button>
              </Stack>
            </Paper>
            {/* WebIlastik Card
            The info for this section is available via the segments function
            */}
            <Paper
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
                      WebIlastik
                    </Typography>
                  </Box>
                  <Tooltip title={`WebIlastik tooltip`}>
                    <Chip
                      label={`${totalImages}`}
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
                        color="warning"
                        fontWeight="bold"
                      >
                        {0}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowOutward />}
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
            </Paper>
            {/* WebNutil 
            integrity is verified via the csv/other type of result presence WIP */}
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
                      color="secondary.main"
                    >
                      WebNutil
                    </Typography>
                  </Box>
                  <Tooltip title={`Pynutil tooltip`}>
                    <Chip
                      label={`?`}
                      size="small"
                      color="secondary"
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
                        {0}%
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
                  fullWidth
                >
                  Continue in WebNutil
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
