import React, { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Snackbar,
    Chip,
    Box
} from '@mui/material';
import { uploadToPath } from '../actions/handleCollabs';
import UploadZone from './UploadZone';

export default function CreationDialog({ open, onClose, onSubmit, project, updateProjects, token, brainEntries }) {
    const [name, setName] = useState('');
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editBrainsList, setEditBrainsList] = useState([]);

    useEffect(() => {
        if (brainEntries) {
            const editBrains = brainEntries
                .map((entry) => entry.name);
            setEditBrainsList(editBrains);
            console.log(editBrains);
        }
    }, [brainEntries]);

    const handleNameChange = (event) => {
        setName(event.target.value);
    };

    // Allow user to unselect files
    const handleFilesSelected = (files) => {
        setFilesToUpload(files);
    };

    const uploadFiles = async () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userName = userInfo.username;
        const collabName = `${userName}-rwb`;

        if (filesToUpload.length > 0) {
            try {
                const uploadedFiles = await Promise.all(
                    filesToUpload.map(async (file) => {
                        const result = await uploadToPath(token, collabName, project.name, name, file);
                        return { ...result, originalFile: file };
                    })
                );
                return uploadedFiles;
            } catch (error) {
                console.error('Error uploading files:', error);
                throw error;
            }
        }
        return [];
    };

    const handleSubmit = async () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userName = userInfo.username;
        const collabName = `${userName}-rwb`;
        try {
            const uploadedFiles = await uploadFiles();
            if (typeof onSubmit === 'function') {
                onSubmit({ name, files: uploadedFiles });
            }
            setSnackbarMessage('Brain created and files uploaded successfully!');
            setSnackbarOpen(true);
            updateProjects(collabName);
            onClose();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            setSnackbarMessage('Error creating brain or uploading files. Please try again.');
            setSnackbarOpen(true);
        }
    };
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleChipClick = (brainName) => {
        setName(brainName);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { minHeight: '80vh' } }}>
                <DialogTitle>Create a new Brain in Project {project?.name || ''}</DialogTitle>
                <DialogContent sx={{ padding: '20px' }}>
                    <DialogContentText sx={{ marginBottom: '20px' }}>
                        Enter the name of the brain, or click on already created brains, upload files, choose and click submit.
                    </DialogContentText>
                    <Box
                        sx={{
                            display: 'flex',
                            overflow: 'auto',
                            whiteSpace: 'nowrap',
                            mb: 2,
                            pb: 1,
                            '&::-webkit-scrollbar': {
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#bbb',
                                borderRadius: '4px',
                            }
                        }}
                    >
                        {editBrainsList.map((brainName, index) => (
                            <Chip
                                key={index}
                                label={brainName}
                                onClick={() => handleChipClick(brainName)}
                                color="primary"                     // Built-in MUI color
                                sx={{
                                    m: 0.5,
                                    '&:first-of-type': { ml: 0 },
                                    '&:hover': { cursor: 'pointer' }
                                }}
                            />
                        ))}
                    </Box>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={handleNameChange}
                        sx={{ marginBottom: '20px' }}
                    />

                    <UploadZone
                        onFilesSelected={handleFilesSelected}
                    />

                </DialogContent>
                <DialogActions sx={{ padding: '20px' }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Submit</Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />
        </>
    );
}
