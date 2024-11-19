import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button,
    FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';

const AtlasGen = ({ zips, bucketName, token }) => {
    const [collection, setCollection] = useState([]);
    const [selectedAtlas, setSelectedAtlas] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        if (zips.length !== 0) {
            setCollection(zips);
        }
    }, [zips]);



    // Helper functions
    const extractSectionNumber = (filename) => {
        const match = filename.match(/s(\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    const dzisection = (dzi, filename) => {
        return {
            filename,
            width: parseInt(dzi.match(/Width="(\d+)"/m)[1]),
            height: parseInt(dzi.match(/Height="(\d+)"/m)[1]),
            tilesize: parseInt(dzi.match(/TileSize="(\d+)"/m)[1]),
            overlap: parseInt(dzi.match(/Overlap="(\d+)"/m)[1]),
            format: dzi.match(/Format="([^"]+)"/m)[1],
            snr: extractSectionNumber(filename)
        };
    };

    const generateAtlasConfig = () => {
        if (!selectedAtlas || collection.length === 0) return;

        const sortedCollection = [...collection].sort((a, b) => a.snr - b.snr);
        const sections = sortedCollection.map(item => ({
            filename: item.filename,
            width: item.width,
            height: item.height,
            snr: item.snr,
            format: item.format.toLowerCase(),
            current: 0,
            tilesize: item.tilesize,
            overlap: item.overlap,
            mode: 0
        }));

        const config = {
            atlas: selectedAtlas,
            sections,
            bucket: bucketName,
            current: 1,
            mode: 0
        };

        setConfig(config);
        return config;
    };

    const ATLAS_OPTIONS = {
        'WHS_SD_rat_v2': 'Waxholm Space Atlas of the Sprague Dawley rat v2',
        'WHS_SD_rat_v3': 'Waxholm Space Atlas of the Sprague Dawley rat v3',
        'WHS_SD_rat_v4': 'Waxholm Space Atlas of the Sprague Dawley rat v4',
        'ABA_Mouse_CCFv3_2015': 'Allen Mouse Brain Atlas version 3 2015',
        'ABA_Mouse_CCFv3_2017': 'Allen Mouse Brain Atlas version 3 2017'
    };

    return (
        <Box sx={{ p: 2 }}>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        DZI Processing Results
                    </Typography>
                    {collection.length > 0 && (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Filename</TableCell>
                                    <TableCell>Format</TableCell>
                                    <TableCell>Width</TableCell>
                                    <TableCell>Height</TableCell>
                                    <TableCell>Tile Size</TableCell>
                                    <TableCell>Overlap</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...collection].sort((a, b) => a.snr - b.snr).map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {`${item.filename.split("/").slice(-1)[0]} (s${item.snr.toString().padStart(3, '0')})`}
                                        </TableCell>
                                        <TableCell>{item.format}</TableCell>
                                        <TableCell>{item.width}</TableCell>
                                        <TableCell>{item.height}</TableCell>
                                        <TableCell>{item.tilesize}</TableCell>
                                        <TableCell>{item.overlap}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                        <InputLabel>Atlas Reference</InputLabel>
                        <Select
                            value={selectedAtlas}
                            onChange={(e) => setSelectedAtlas(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {Object.entries(ATLAS_OPTIONS).map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={generateAtlasConfig}
                        disabled={!selectedAtlas || collection.length === 0}
                        fullWidth
                    >
                        Generate Atlas Configuration
                    </Button>

                    {config && (
                        <Box sx={{ mt: 2 }}>
                            <pre>{JSON.stringify(config, null, 2)}</pre>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default AtlasGen;