import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  Button,
} from "@mui/material";
import netunzip from "../actions/atlasUtils";
import { uploadToJson } from "../actions/handleCollabs";

// Extractor definitions
// Filename has to match the exact name of the DZIP file instead of dzi
const dzisection = (dzi, filename) => {
  const newFilename = filename.replace(/\.dzi$/, ".dzip");
  return {
    filename: newFilename,
    width: parseInt(dzi.match(/Width="(\d+)"/m)[1]),
    height: parseInt(dzi.match(/Height="(\d+)"/m)[1]),
    tilesize: parseInt(dzi.match(/TileSize="(\d+)"/m)[1]),
    overlap: parseInt(dzi.match(/Overlap="(\d+)"/m)[1]),
    format: dzi.match(/Format="([^"]+)"/m)[1],
  };
};

const convertDziToSection = (dziData, snr = 1) => {
  return {
    filename: dziData.filename,
    width: dziData.width,
    height: dziData.height,
    snr: snr,
    format: dziData.format,
    tilesize: dziData.tilesize,
    overlap: dziData.overlap,
  };
};

// Atlas map
const atlasValueToName = {
  1: "Waxholm Space Atlas of the Sprague Dawley rat v2",
  2: "WHS_SD_Rat_v3_39um",
  3: "WHS_SD_Rat_v4_39um",
  4: "Allen Mouse Brain Atlas version 3 2015",
  5: "ABA_Mouse_CCFv3_2017_25um",
};

// Main function to get called with a list

function Atlas({ bucketName, dzips, token, updateInfo, refreshBrain }) {
  const [atlasName, setAtlasName] = useState(null);
  const [creating, setCreating] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [atlasProgress, setAtlasProgress] = useState(0);

  const createAtlas = async (atlasName, bucketName, dzips, token) => {
    const sortedDzips = [...dzips].sort((a, b) => a.name.localeCompare(b.name));
    const split = dzips[0].name.split("/");
    const uploadObj = {
      token: token,
      bucketName: bucketName,
      projectName: split[0],
      brainName: split[1],
    };
    let brainAnnounce = uploadObj.brainName;

    try {
      const pathParts = dzips[0].name.split("/");
      pathParts.pop();
      const dziproot = pathParts.join("/");

      const atlas = {
        atlas: atlasName,
        sections: [],
        bucket: bucketName,
        dziproot: dziproot + "/",
      };

      // Redirect param expected for authenticated downloads
      const urlLocator = (url) => {
        return () =>
          fetch(`${url}?redirect=false`, {
            headers: { authorization: `Bearer ${token}` },
          })
            .then((response) => response.json())
            .then((json) => json.url);
      };

      for (let [index, dzipObj] of sortedDzips.entries()) {
        const zipdir = await netunzip(
          urlLocator(
            `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/${dzipObj.name}`
          )
        );

        const dziEntry = Array.from(zipdir.entries.values()).find((entry) =>
          entry.name.endsWith(".dzi")
        );

        if (dziEntry) {
          const data = await zipdir.get(dziEntry);
          const dziContent = new TextDecoder().decode(data);
          const dziData = dzisection(dziContent, dziEntry.name);
          const sectionData = convertDziToSection(dziData, index + 1);
          atlas.sections.push(sectionData);
        }

        setAtlasProgress((index + 1) / sortedDzips.length);
        console.log(
          `Atlas ${atlasName} (${index + 1}/${sortedDzips.length}) created`
        );
      }

      const walnName = `${atlasName
        .toLowerCase()
        .replace(/\s+/g, "_")}_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .slice(0, 19)}.waln`;
      const response = await uploadToJson(uploadObj, walnName, atlas);
      return atlas;
    } catch (error) {
      console.error("Error creating atlas:", error);
      throw error;
    }
  };

  if (!bucketName || !dzips || !token) {
    return null;
  }

  useEffect(() => {
    console.log("Files staged for registration", dzips);
    if (dzips && Array.isArray(dzips)) {
      setImageCount(dzips.length);
      console.log(imageCount, "images are ready for registration");
    }
  }, [dzips]);

  return (
    <Card sx={{ boxShadow: "none", width: "100%", alignItems: "left" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            {imageCount || 0} Images are ready for registration
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            Generate registration file
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FormControl
            fullWidth
            variant="standard"
            sx={{
              margin: "1px",
              width: "80%",
            }}
          >
            <InputLabel htmlFor="grouped-select">
              Select the reference atlas
            </InputLabel>
            <Select
              defaultValue=""
              id="grouped-select"
              label="Select the reference atlas"
              dense="true"
              onChange={(event) => {
                const value = event.target.value;
                setAtlasName(value ? atlasValueToName[value] : null);
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <ListSubheader>Rat Brain Atlases</ListSubheader>
              <MenuItem value={2}>
                Waxholm Space Atlas of the Sprague Dawley rat v3
              </MenuItem>
              <MenuItem value={3}>
                Waxholm Space Atlas of the Sprague Dawley rat v4
              </MenuItem>
              <ListSubheader>Mouse Brain Atlases</ListSubheader>
              <MenuItem value={5}>
                Allen Mouse Brain Atlas version 3 2017
              </MenuItem>
            </Select>
          </FormControl>
          {creating && <Typography>Generating registration...</Typography>}
          {!creating && (
            <Button
              variant="outlined"
              sx={{
                borderColor: "black",
                color: "black",

                "&:hover": {
                  borderColor: "black",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
              onClick={async () => {
                if (!atlasName) {
                  updateInfo({
                    open: true,
                    message: `Please select an atlas`,
                    severity: "error",
                  });
                  return;
                }

                setCreating(true);
                console.log("Creating following atlas: ");
                updateInfo({
                  open: true,
                  message: `Generation of the registration file is in progress...`,
                  severity: "info",
                });
                await createAtlas(atlasName, bucketName, dzips, token);
                refreshBrain();
                setCreating(false);
              }}
            >
              Generate
            </Button>
          )}
        </Box>
        <Box sx={{ width: "100%", height: 10 }}>
          {creating && (
            <Box
              sx={{
                width: `${atlasProgress * 100}%`,
                height: "100%",
                backgroundColor: "primary.main",
              }}
            ></Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default Atlas;
