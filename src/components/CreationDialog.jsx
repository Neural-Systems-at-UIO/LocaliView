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
    Box,
    Alert,
    Autocomplete
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
                <DialogTitle>Upload an image series in {project?.name || ''}</DialogTitle>
                <DialogContent sx={{ padding: '20px' }}>
                    <DialogContentText sx={{ marginBottom: '20px' }}>
                        Enter the name of the series, or click on already created serie, upload files, choose and click submit.
                    </DialogContentText>
                    <Autocomplete
                        freeSolo
                        id="brain-name-combo"
                        options={editBrainsList}
                        value={name}
                        onChange={(event, newValue) => {
                            // Agnostic replace to handle both selection from dropdown and manual entry
                            if (newValue) {
                                handleNameChange({ target: { value: newValue } });
                            }
                        }}
                        onInputChange={(event, newValue) => {
                            handleNameChange({ target: { value: newValue } });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                autoFocus
                                margin="dense"
                                label="Name"
                                variant="outlined"
                                fullWidth
                                sx={{ marginBottom: '20px' }}
                            />
                        )}
                        sx={{
                            '& .MuiAutocomplete-listbox': {
                                '&::-webkit-scrollbar': {
                                    height: '8px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#bbb',
                                    borderRadius: '4px',
                                }
                            }
                        }}
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
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    sx={{ width: '100%' }}
                    elevation={4}
                    onClose={handleSnackbarClose}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
}
