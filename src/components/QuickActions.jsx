import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    Button,
    LinearProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader,
    CircularProgress,
    Tooltip,
    ListItemIcon
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import InfoIcon from '@mui/icons-material/Info';
import { useState, useEffect } from 'react';
import { Info } from '@mui/icons-material';

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
    let pyramidCount = stats[1]?.zips.length || 0;
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
    const brainPyramids = stats[1] || {};

    if (isLoading) {
        return (
            <Box sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                width: '100%'
            }}>
                <Typography variant="body2" color="textSecondary">
                    Loading brain stats...
                </Typography>
                <CircularProgress size={15} />
            </Box>
        );
    }

    const pyramidComplete = pyramidCount === brainStats.files;

    return (
        <Box sx={{ overflow: 'auto', p: 2 }}>
            <Grid container spacing={2}>
                <Grid size={3}>
                    <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                        <Typography
                            variant="h5"
                            color="primary"
                            gutterBottom

                            sx={{
                                fontWeight: 'bold',
                                textWrap: 'wrap',
                            }}
                            textAlign='left'
                            padding={2}
                        >
                            {braininfo.name}
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Total Images"
                                    secondary={brainStats.files || 'N/A'}
                                />
                                <Tooltip title="You can add more images from the 'Add or Edit' button">
                                    <InfoIcon fontSize="small" color="action" />
                                </Tooltip>

                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Size of Brain"
                                    secondary={brainStats.size ? formatFileSize(brainStats.size) : 'N/A'}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Last updated on"
                                    secondary={brainStats.last_modified ? brainStats.last_modified.toLocaleString() : 'N/A'}
                                />
                            </ListItem>
                        </List>
                    </Card>
                </Grid>

                <Grid size={9} container spacing={1}>
                    <Grid size={12} >
                        <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    mb: 2
                                }}>
                                    <Box sx={{ mb: { xs: 2, sm: 0 } }}>
                                        <Typography
                                            variant="body1"
                                            color="text.primary"
                                            sx={{ textAlign: 'left', mb: 0.5 }}
                                        >
                                            Tiff files to be converted: {brainStats.files - stats[1]?.zips.length || 0}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            color="text.primary"
                                            sx={{ textAlign: 'left' }}
                                        >
                                            Currently in processed files: {stats[1]?.zips.length || 0}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        disabled={isProcessing || pyramidComplete || brainStats.files === 0}
                                        onClick={() => processTiffFiles()}
                                        sx={{
                                            minWidth: 120,
                                            height: 40,
                                            borderColor: (theme) => theme.palette.grey[800],
                                            color: (theme) => theme.palette.grey[800],
                                            '&:hover': {
                                                borderColor: (theme) => theme.palette.grey[900],
                                                backgroundColor: (theme) => theme.palette.action.hover
                                            }
                                        }}
                                    >
                                        {pyramidComplete ? 'Complete' : isProcessing ? 'Processing...' : 'Process Files'}
                                    </Button>
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mb: 1,
                                            textAlign: 'left',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        Progress: {pyramidCount} / {brainStats.files || 0} files processed
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(pyramidCount / (brainStats.files || 1)) * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: (theme) => theme.palette.grey[200],
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4
                                            }
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={12} >
                        <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', alignItems: 'left' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

                                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                                        {brainPyramids.zips.length || 'No'} Images are ready for alignment
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
                                        <Select defaultValue="" id="grouped-select" label="Atlas Reference" dense='true'>
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
                                        disabled={!pyramidComplete || brainPyramids.zips.length === 0}
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
                                </Box>

                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

            </Grid>
        </Box>
    );
};

export default AdditionalInfo;