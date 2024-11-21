import React, { useState, useEffect } from 'react';
import { Card, CardContent, Box, Typography, FormControl, InputLabel, Select, MenuItem, ListSubheader, Button } from '@mui/material';
import netunzip from '../actions/atlasUtils';
import { uploadToJson } from '../actions/handleCollabs';

// Extractor definitions
const dzisection = (dzi, filename) => {
    return {
        filename,
        width: parseInt(dzi.match(/Width="(\d+)"/m)[1]),
        height: parseInt(dzi.match(/Height="(\d+)"/m)[1]),
        tilesize: parseInt(dzi.match(/TileSize="(\d+)"/m)[1]),
        overlap: parseInt(dzi.match(/Overlap="(\d+)"/m)[1]),
        format: dzi.match(/Format="([^"]+)"/m)[1]
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
    5: "ABA_Mouse_CCFv3_2017_25um"
};


// Main function to get called with a list

const createAtlas = async (atlasName, bucketName, dzips, token) => {

    // TODO - add tally counter for snr's, automatic or manual

    // This is a clean sort as there are numbers in the middle of the names
    // later on is an automatic section sorter
    const sortedDzips = [...dzips].sort();

    const split = dzips[0].split('/');
    const uploadObj = {
        token: token,
        bucketName: bucketName,
        projectName: split[0],
        brainName: split[1],
    }

    console.log(uploadObj);


    // This would sort the sections but there maybe more than one sectin with the same number

    /*
    const sortedDzips = [...dzips].sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });
    */

    try {
        // Initialize atlas structure from the passed down params.
        const atlas = {
            atlas: atlasName,
            sections: [],
            bucket: bucketName,
        };


        // Process each DZIP file
        for (let [index, dzipUrl] of sortedDzips.entries()) {
            // Fetch with authentication
            const fetchWithAuth = async (urlPath) => {
                const baseUrl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/`;
                const fullUrl = baseUrl + urlPath;

                const options = {
                    method: 'GET',
                    //headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                };
                return fetch(fullUrl, options);
            };

            // Load and process zip
            const zipdir = await netunzip(async () => {
                const response = await fetchWithAuth(dzipUrl);
                return response.url;
            });

            // Find DZI file in zip
            const dziEntry = Array.from(zipdir.entries.values())
                .find(entry => entry.name.endsWith('.dzi'));

            if (dziEntry) {
                const data = await zipdir.get(dziEntry);
                const dziContent = new TextDecoder().decode(data);
                const dziData = dzisection(dziContent, dziEntry.name);
                const sectionData = convertDziToSection(dziData, index + 1);
                atlas.sections.push(sectionData);
            }


        }
        const walnName = atlasName
            .toLowerCase()
            .replace(/\s+/g, '_')
            + '_' + new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .slice(0, 19)
            + '.waln';

        const response = await uploadToJson(uploadObj, walnName, atlas);
        console.log('Atlas uploaded:', response);

        return atlas;


    } catch (error) {
        console.error('Error creating atlas:', error);
        throw error;
    }
};

function Atlas({ bucketName, dzips, token, updateInfo }) {
    const [atlasName, setAtlasName] = useState(null);
    const [creating, setCreating] = useState(false);
    const [imageCount, setImageCount] = useState(0);

    if (!bucketName || !dzips || !token) {
        return null;
    }

    useEffect(() => {
        if (dzips && Array.isArray(dzips)) {
            setImageCount(dzips.length);
        }
    }, [dzips]);

    return (
        <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', alignItems: 'left' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                        {imageCount || 0} Images are ready for alignment
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                        Generate atlas referenced alignment

                    </Typography>

                </Box>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                }}>
                    <FormControl
                        fullWidth
                        variant="standard"
                        sx={{
                            margin: '1px',
                            width: '80%'
                        }}
                    >
                        <InputLabel htmlFor="grouped-select">Atlas reference</InputLabel>
                        <Select
                            defaultValue=""
                            id="grouped-select"
                            label="Atlas Reference"
                            dense='true'
                            onChange={(event) => {
                                const value = event.target.value;
                                setAtlasName(value ? atlasValueToName[value] : null);
                            }}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            <ListSubheader>Rat Brain Atlases</ListSubheader>
                            <MenuItem disabled={true} value={1}>Waxholm Space Atlas of the Sprague Dawley rat v2</MenuItem>
                            <MenuItem value={2}>Waxholm Space Atlas of the Sprague Dawley rat v3</MenuItem>
                            <MenuItem value={3}>Waxholm Space Atlas of the Sprague Dawley rat v4</MenuItem>
                            <ListSubheader>Mouse Brain Atlases</ListSubheader>
                            <MenuItem disabled={true} value={4}>Allen Mouse Brain Atlas version 3 2015</MenuItem>
                            <MenuItem value={5}>Allen Mouse Brain Atlas version 3 2017</MenuItem>
                        </Select>
                    </FormControl>
                    {creating && <Typography>Creating atlas...</Typography>}
                    {!creating && <Button
                        variant="outlined"

                        sx={{
                            borderColor: 'black',
                            color: 'black',

                            '&:hover': {
                                borderColor: 'black',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                        onClick={async () => {
                            setCreating(true);
                            console.log(createAtlas(atlasName, bucketName, dzips, token));
                            setCreating(false);
                            updateInfo({
                                open: true,
                                message: 'a new atlas has been created',
                                severity: 'success'
                            }
                            );
                        }
                        }
                    >
                        Generate
                    </Button>}
                </Box>

            </CardContent>
        </Card>
    );
}

export default Atlas;