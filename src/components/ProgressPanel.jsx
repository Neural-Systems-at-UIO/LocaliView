import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import MapIcon from "@mui/icons-material/Map";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SquareFootIcon from "@mui/icons-material/SquareFoot";

export default function ProgressPanel({ walnContent }) {
  if (!walnContent) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
        <Typography variant="body2" color="text.secondary">
          WIP ATLAS STATS WILL NOT BE DISPLAYED IF ATLAS MISSING
        </Typography>
      </Box>
    );
  }

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
              {walnContent.atlas}
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

        {/* Stats Row */}
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
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SquareFootIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                WebAlign Progress (QUICKNII) ({sectionsWithOUV}/{totalImages})
              </Typography>
            </Stack>
            <Tooltip title={`${sectionsWithOUV} sections with OUV data`}>
              <LinearProgress
                variant="determinate"
                value={(sectionsWithOUV / totalImages) * 100}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Tooltip>
          </Stack>

          <Stack spacing={0.5}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                WebWarp Progress (VISUALIGN) ({sectionsWithMarkers}/
                {totalImages})
              </Typography>
            </Stack>
            <Tooltip title={`${sectionsWithMarkers} sections with markers`}>
              <LinearProgress
                variant="determinate"
                value={(sectionsWithMarkers / totalImages) * 100}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
