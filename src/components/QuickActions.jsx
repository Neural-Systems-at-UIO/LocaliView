import React from 'react';
import {
    Box, Typography, List, ListItem, ListItemText, Card, CardContent, Button, LinearProgress, Skeleton, FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { callDeepZoom } from '../actions/handleCollabs';

// Importing deepzoom here 
const DEEPZOOM_URL = import.meta.env.VITE_APP_DEEPZOOM_URL;

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdditionalInfo = ({ braininfo, stats, isLoading, token }) => {
    let pyramidCount = stats[1]?.zip.length || 0;
    const [user, setUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bucketName, setBucketName] = useState(null);

    useEffect(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            setUser(userInfo.username);
            setBucketName(`${user}-rwb`);

        } catch (error) {
            console.error('Error parsing userInfo:', error);
        }
    }, []);

    const processImage = async (imageFile, bucket, targetPath, token) => {
        try {
            const response = await fetch(DEEPZOOM_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    path: `${bucket}/${imageFile.path}`,
                    target_path: `${bucket}/${targetPath}`,
                    token: token
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error processing file ${imageFile.name}:`, error);
            throw error;
        }
    };

    const processTiffFiles = async () => {
        if (!braininfo || !stats[0]?.tiffs?.length) {
            alert("No TIFF files found to process");
            return;
        }

        setIsProcessing(true);
        const sourceBrain = braininfo.path; // e.g. "project/brain1/"
        const imageFiles = stats[0].tiffs.map(tiffPath => ({
            path: tiffPath,
            name: tiffPath.split('/').pop()
        }));

        try {
            const promises = imageFiles.map(imageFile => {
                const targetPath = `${sourceBrain}zipped_images/`;
                return processImage(imageFile, bucketName, targetPath, token);
            });

            await Promise.all(promises);
            alert("All TIFF files submitted for processing");
        } catch (error) {
            console.error("Error processing TIFF files:", error);
            alert("Some files failed to process. Check the console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!braininfo) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <Typography variant="h5" color="textSecondary">
                    Choose a brain
                </Typography>
            </Box>
        );
    }

    const brainStats = stats[0] || {};

    if (isLoading) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
                <List>
                    {[1, 2, 3].map((item) => (
                        <ListItem key={item}>
                            <ListItemText
                                primary={<Skeleton width="40%" />}
                                secondary={<Skeleton width="60%" />}
                            />
                        </ListItem>
                    ))}
                </List>
                <Card sx={{ boxShadow: 'none', mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                        <Skeleton variant="rectangular" height={100} />
                    </CardContent>
                </Card>
            </Box>
        );
    }

    const pyramidComplete = pyramidCount === brainStats.files;

    return (
        <Box sx={{ overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                <Card sx={{ boxShadow: 'none', mb: 2, border: '1px solid #e0e0e0' }}>
                    <Typography
                        variant="h5"
                        color="primary"
                        gutterBottom
                        sx={{ fontWeight: 'bold' }}
                        textAlign='left'
                        padding={2}
                    >
                        {braininfo.name}
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Total Entries"
                                secondary={brainStats.files || 'N/A'}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Size of Brain"
                                secondary={brainStats.size ? formatFileSize(brainStats.size) : 'N/A'}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Last uploaded"
                                secondary={brainStats.last_modified ? brainStats.last_modified.toLocaleString() : 'N/A'}
                            />
                        </ListItem>
                    </List>
                </Card>
                <Card sx={{ boxShadow: 'none', mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography color="text.primary">
                                Tiff Files to be Converted: {brainStats.files - stats[1]?.zip.length || 0}
                                <br />
                                Currently in Zipped Files: {stats[1]?.zip.length || 0}
                            </Typography>
                            <Button
                                variant="outlined"
                                disabled={isProcessing || pyramidComplete}
                                onClick={() => processTiffFiles()}
                                sx={{
                                    borderColor: 'black',
                                    color: 'black',
                                    '&:hover': {
                                        borderColor: 'black',
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                {pyramidComplete ? 'Complete' : isProcessing ? 'Processing...' : 'Process Files'}
                            </Button>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ mb: 1 }}>
                                Progress: {pyramidCount} / {brainStats.files || 0} files processed
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(pyramidCount / (brainStats.files || 1)) * 100}
                                sx={{
                                    height: 8,
                                    borderRadius: 4
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
                <Card sx={{ boxShadow: 'none', mb: 2, border: '1px solid #e0e0e0', maxWidth: '48%' }}>
                    <CardContent>
                        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                            Generate atlas referenced alignment
                        </Typography>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            sx={{ marginBottom: '20px' }}
                        >
                            <InputLabel htmlFor="grouped-select">Atlas reference</InputLabel>
                            <Select defaultValue="" id="grouped-select" label="Atlas Reference">
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <ListSubheader>Rat Brain Atlases</ListSubheader>
                                <MenuItem value={1}>Waxholm Space Atlas of the Sprague Dawley rat v2</MenuItem>
                                <MenuItem value={2}>Waxholm Space Atlas of the Sprague Dawley rat v3</MenuItem>
                                <MenuItem value={3}>Waxholm Space Atlas of the Sprague Dawley rat v4</MenuItem>
                                <ListSubheader>Mouse Brain Atlases</ListSubheader>
                                <MenuItem value={4}>Allen Mouse Brain Atlas version 3 2015</MenuItem>
                                <MenuItem value={5}>Allen Mouse Brain Atlas version 3 2017</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            sx={{
                                borderColor: 'black',
                                color: 'black',
                                '&:hover': {
                                    borderColor: 'black',
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            Generate
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default AdditionalInfo;