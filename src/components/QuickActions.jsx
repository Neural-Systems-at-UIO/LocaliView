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
    Alert,
    Snackbar,
    ListItemIcon,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import InfoIcon from '@mui/icons-material/Info';
import { useState, useEffect } from 'react';
import Atlas from './Atlas';
import { AutoAwesomeMotionSharp, ImageSharp } from '@mui/icons-material';

// Importing deepzoom here 
const DEEPZOOM_URL = import.meta.env.VITE_APP_DEEPZOOM_URL;

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// To fit some of the dates in case of long names
const dateOptions = {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: '2-digit'
};


const AdditionalInfo = ({ braininfo, stats, isLoading, token }) => {
    let pyramidCount = stats[1]?.zips.length || 0;
    const [user, setUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bucketName, setBucketName] = useState(null);

    // Alignment Json state
    const [selectedJson, setSelectedJson] = useState('');

    // Info messages
    const [infoMessage, setInfoMessage] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    useEffect(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            setUser(userInfo.username);
            setBucketName(`${user}-rwb`);

        } catch (error) {
            console.error('Error parsing userInfo:', error);
        }
    }, [token, stats]);

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
            setInfoMessage({
                open: true,
                message: 'No TIFF files found to process',
                severity: 'warning'
            });
            return;
        }

        setIsProcessing(true);
        const sourceBrain = braininfo.path; // e.g. "project/brain1/"
        const imageFiles = stats[0].tiffs.map(tiffObj => ({
            path: tiffObj.name,
            name: tiffObj.name.split('/').pop()
        }));

        try {
            const promises = imageFiles.map(imageFile => {
                const targetPath = `${sourceBrain}zipped_images/`;
                return processImage(imageFile, bucketName, targetPath, token);
            });

            await Promise.all(promises);
            setInfoMessage({
                open: true,
                message: 'All TIFF files submitted for processing',
                severity: 'success'
            });
        } catch (error) {
            console.error("Error processing TIFF files:", error);
            setInfoMessage({
                open: true,
                message: 'Error processing TIFF files. Check the console for details.',
                severity: 'error'
            });
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
    const walnJson = stats[2] || {};

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
            <Snackbar
                open={infoMessage.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                autoHideDuration={3000}

            >
                <Alert
                    onClose={() => setInfoMessage({ ...infoMessage, open: false })}
                    severity={infoMessage.severity}
                    elevation={6}
                >
                    {infoMessage.message}
                </Alert>
            </Snackbar>
            <Grid container spacing={2}>
                <Grid size={3}>
                    <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', height: '100%' }}>
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
                                    secondary={new Date().toLocaleString()}
                                />
                            </ListItem>
                        </List>
                    </Card>
                </Grid>
                <Grid size={9} >
                    <Card sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                        <CardContent>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                mb: 2,
                                width: '100%'
                            }}>
                                <Box sx={{ mb: { xs: 2, sm: 0 }, width: '100%' }}>

                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'left' }}>
                                                Tiff files to be converted: {brainStats.files - stats[1]?.zips.length || 0}
                                            </Typography>
                                            <Box sx={{
                                                flex: 1,
                                                maxHeight: 200,
                                                overflow: 'auto',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                mt: 1

                                            }}>

                                                <List>
                                                    {brainStats.tiffs?.map((tiff, index) => (
                                                        <ListItem key={index} sx={{

                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                            },

                                                            '&:last-child': {
                                                                borderBottom: 'none',
                                                            },
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            <ListItemIcon>
                                                                <ImageSharp />
                                                            </ListItemIcon>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12
                                                                }}>
                                                                {tiff.name.split('/').slice(-1)[0]}
                                                            </ Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12
                                                                }}>
                                                                {formatFileSize(tiff.bytes)}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12
                                                                }}>
                                                                {new Date(tiff.last_modified).toLocaleString('en-GB', dateOptions)}
                                                            </Typography>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'left' }}>
                                                Currently in processed files: {stats[1]?.zips.length || 0}
                                            </Typography>
                                            <Box sx={{
                                                flex: 1,
                                                maxHeight: 200,
                                                overflow: 'auto',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                mt: 1
                                            }}>
                                                <List>
                                                    {stats[1]?.zips?.map((zip, index) => (
                                                        <ListItem key={index} sx={{
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                            },
                                                            '&:last-child': {
                                                                borderBottom: 'none',
                                                            },
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            <ListItemIcon>
                                                                <AutoAwesomeMotionSharp />
                                                            </ListItemIcon>
                                                            <Typography variant="body2"
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12,
                                                                    textAlign: 'left'
                                                                }}>
                                                                {zip.name.split('/').slice(-1)[0]}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12
                                                                }}>
                                                                {formatFileSize(zip.bytes)}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontSize: 12
                                                                }}>
                                                                {new Date(zip.last_modified).toLocaleString('en-GB', dateOptions)}
                                                            </Typography>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        </Box>
                                    </Box>


                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                                    <Box sx={{ mt: 3, width: '100%' }}>
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                                        <Button
                                            variant="outlined"
                                            disabled={isProcessing || pyramidComplete || brainStats.files === 0}
                                            onClick={() => processTiffFiles()}
                                            sx={{
                                                size: 'md',
                                                borderColor: (theme) => theme.palette.grey[800],
                                                color: (theme) => theme.palette.grey[800],
                                                '&:hover': {
                                                    borderColor: (theme) => theme.palette.grey[900],
                                                    backgroundColor: (theme) => theme.palette.action.hover
                                                },
                                                mt: 3
                                            }}
                                        >
                                            {pyramidComplete ? 'Complete' : isProcessing ? 'Processing...' : 'Process'}
                                        </Button>


                                    </Box>

                                </Box>


                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{
                mt: 2,
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                p: 1,
                borderRadius: 1
            }}>
                <Atlas
                    token={token}
                    bucketName={bucketName}
                    dzips={brainPyramids.zips}
                    updateInfo={setInfoMessage}
                />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}>
                    <Card sx={{ boxShadow: 'none', width: '100%' }}>
                        <CardContent>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Typography>
                                    Alignment files ({walnJson.jsons?.length || 'N/A'})
                                </Typography>

                                <Select
                                    value={selectedJson}
                                    onChange={(e) => {
                                        setSelectedJson(e.target.value);
                                        console.log(selectedJson.split('/').slice(-1)[0]);
                                    }}
                                    size='small'
                                    sx={{
                                        width: '180px',
                                        '& .MuiSelect-select': {
                                            textOverflow: 'ellipsis'
                                        }
                                    }}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>
                                        Select an alignment file
                                    </MenuItem>
                                    {walnJson.jsons?.map((jsonPath, index) => (
                                        <MenuItem
                                            key={index}
                                            value={jsonPath}
                                            sx={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {jsonPath.name.split('/').slice(-1)[0]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default AdditionalInfo;