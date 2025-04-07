import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// Project handling
import {
  fetchBucketDir,
  fetchBrainStats,
  createProject,
  checkBucketExists,
  downloadWalnJson,
  deleteItem,
} from "../actions/handleCollabs.js";
import CreationDialog from "./CreationDialog.jsx";
import BrainTable from "./BrainTable.jsx";
import QuickActions from "./QuickActions.jsx";
import ProgressPanel from "./ProgressPanel.jsx";

export default function QuintTable({ token, user }) {
  // Query helpers
  const [bucketName, setBucketName] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [selectedBrainStats, setSelectedBrainStats] = useState([]);
  const [projectBrainEntries, setProjectBrainEntries] = useState(() => {
    try {
      const storedEntries = localStorage.getItem("projectBrainEntries");
      return storedEntries ? JSON.parse(storedEntries) : [];
    } catch (error) {
      console.error("Error parsing projectBrainEntries:", error);
      return [];
    }
  });
  // Other stuff
  const [rows, setRows] = useState(() => {
    try {
      const storedEntries = localStorage.getItem("projectBrainEntries");
      const entries = storedEntries ? JSON.parse(storedEntries) : [];
      return entries.map((entry, index) => ({
        id: index,
        name: entry.name.split("/").pop(),
        type: entry.type,
        path: entry.path,
      }));
    } catch (error) {
      console.error("Error parsing rows from projectBrainEntries:", error);
      return [];
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [updatingBrains, setUpdatingBrains] = useState(false);
  // To create a new project state
  const [newProjectName, setNewProjectName] = useState("");

  // Project view issues
  const [projectIssue, setProjectIssue] = useState({
    problem: false,
    message: "",
    severity: "info", // 'error' | 'warning' | 'info' available as of now
    loading: false,
  });

  const [walnContent, setWalnContent] = useState(null);

  // Project state helper for conditional rendering
  const getProjectState = () => {
    if (!token) {
      return "unauthorized";
    }
    if (bucketName === null) {
      return "no-workspace";
    }
    if (projectIssue.loading) {
      return "loading";
    }
    if (projectIssue.problem) {
      return "error";
    }
    if (projects.length === 0) {
      return "empty";
    }
    // TODO Add an i cant find your bucekt and creating
    return "ready";
  };

  const renderProjectContent = () => {
    switch (getProjectState()) {
      case "unauthorized":
        return <Typography>Please log in to view projects</Typography>;
      case "no-workspace":
        return <Typography>Select a workspace to continue</Typography>;
      case "loading":
        return (
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "center", py: 4 }}
          >
            <CircularProgress size={20} />
            <Typography>Loading projects...</Typography>
          </Box>
        );
      case "error":
        return (
          <Box sx={{ color: "error.main", py: 2 }}>
            <Typography>{projectIssue.message}</Typography>
          </Box>
        );
      case "empty":
        return <Typography>This bucket has no projects yet</Typography>;
      default:
        return null; // Projects will be rendered normally
    }
  };

  const fetchAndUpdateProjects = (collabName) => {
    setProjectIssue({
      problem: false,
      message: "",
      severity: "info",
      loading: true,
    });
    fetchBucketDir(token, collabName, null, "/")
      .then((projects) => {
        if (projects.length === 0) {
          console.log("No projects found");
          return;
        }
        console.log(projects);
        setProjects(projects);
        setProjectIssue({
          problem: false,
          message: "",
          severity: "info",
          loading: false,
        });
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
      });
  };

  useEffect(() => {
    try {
      const userName = user.username;
      console.log("User info received by table:", user);
      const collabName = `rwb-${userName}`;
      setBucketName(collabName);

      // Initialize the collab/bucket if it doesn't exist
      const initializeWorkspace = async () => {
        try {
          const resp = await checkBucketExists(token, collabName);
          if (resp) {
            console.log("Bucket already exists");
            setBucketName(collabName);
          } else {
            try {
              const response = await fetch(
                "https://deepzoom.apps.ebrains.eu/api/initialize-collab",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: token,
                    collab_id: collabName,
                  }),
                }
              );

              const data = await response.json();

              if (data.success || response.status === 409) {
                setBucketName(collabName);
              } else {
                throw new Error("Failed to initialize collab");
              }
            } catch (error) {
              console.error("Error initializing collab:", error);
              setProjectIssue({
                problem: true,
                message: "Failed to initialize collab",
                severity: "error",
                loading: false,
              });
            }
          }
        } catch (error) {
          console.error("Error initializing workspace:", error);
          setProjectIssue({
            problem: true,
            message: "Failed to initialize workspace",
            severity: "error",
            loading: false,
          });
        }
      };

      initializeWorkspace();
    } catch (error) {
      console.error("Error parsing userInfo:", error);
    }
  }, [user, token]); // only token hook here to avoid infinite loop

  // Second effect: Fetch projects when we have both token and bucketName
  useEffect(() => {
    if (token && bucketName && projects.length === 0) {
      localStorage.setItem("bucketName", bucketName);
      fetchAndUpdateProjects(bucketName);
    }
  }, [token, bucketName]); // Only depends on token and bucketName

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    localStorage.setItem("selectedProject", JSON.stringify(project));
    setUpdatingBrains(true);

    if (project === null) {
      setSelectedBrain(null);
      setRows([]);
      return;
    }

    try {
      const projectPath = `${project.name}/`;
      const brainEntries = await fetchBucketDir(
        token,
        bucketName,
        projectPath,
        "/"
      );
      const newRows = brainEntries.map((entry, index) => ({
        id: index,
        name: entry.name.split("/").pop(),
        type: entry.type,
        path: entry.path,
      }));
      setRows(newRows);
      localStorage.setItem("projectBrainEntries", JSON.stringify(brainEntries));
      setProjectBrainEntries(brainEntries);
      setUpdatingBrains(false);
    } catch (error) {
      console.error("Error fetching brain entries:", error);
      setRows([]);
      setUpdatingBrains(false);
    }
  };

  const refreshProjectBrains = () => {
    handleProjectSelect(selectedProject);
    setSelectedBrain(null);
    // Initially project change updates the brain list
    // the current brain will be deleted so defaults to null
  };

  const handleBrainSelect = async (params) => {
    console.log("Params passed down", params);
    setWalnContent(null);
    setSelectedBrain(params.row);
    setIsFetchingStats(true);
    console.log(`Selected brain: ${params.row.name}`);
    try {
      const stats = await fetchBrainStats(token, bucketName, params.row.path);
      setSelectedBrainStats(stats);
      localStorage.setItem(
        "selectedBrain",
        JSON.stringify({ ...params.row, project: selectedProject.name })
      );
      console.log(`Selected brain stats:`, stats);

      if (stats && stats[2]?.jsons?.[0]?.name) {
        try {
          const walnContent = await downloadWalnJson(
            token,
            bucketName,
            stats[2].jsons[0].name
          );
          console.log("WALN Content:", walnContent);
          setWalnContent(walnContent);
        } catch (error) {
          console.error("Failed to download WALN:", error);
          setWalnContent(null);
        }
      } else {
        console.log("No WALN file found in stats");
        setWalnContent(null);
      }
    } catch (error) {
      console.error("Error fetching brain stats:", error);
      setSelectedBrainStats([]);
      setWalnContent(null);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const refreshBrain = async () => {
    // Refecthing what we have to update the stats
    if (selectedBrain) {
      handleBrainSelect({ row: selectedBrain });
    }
  };

  const createProjectCall = async (projectName) => {
    console.log(`Creating project: ${projectName}`);
    try {
      let res = await createProject({
        token: token,
        bucketName: bucketName,
        projectName: projectName,
      });
      console.log("Project created:", res);
      fetchAndUpdateProjects(bucketName);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  return (
    <Box
      sx={{
        backgroundColor: "#f6f6f6",
        p: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        height: "99%",
        borderRadius: "4px",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
        {selectedProject === null ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", gap: 2 }}>
            <Box
              sx={{
                flexDirection: "column",
                flexGrow: 1,
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: 2,
                backgroundColor: "white",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 2,
                  justifyContent: "space-between",
                  borderBottom: "1px solid #e0e0e0",
                  pb: 2,
                  mb: 2,
                }}
              >
                {/* Main header with the bucket title as rwb-username */}
                <Typography variant="h5" align="left">
                  Projects in {bucketName}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "space-between",
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="New project..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    sx={{ width: "150px", height: "40px" }}
                  />
                  <Tooltip title="Create new project">
                    <IconButton
                      sx={{ alignSelf: "flex-start" }}
                      onClick={() => {
                        if (newProjectName.trim()) {
                          createProjectCall(newProjectName);
                          setNewProjectName("");
                        }
                      }}
                      disabled={!newProjectName.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open bucket directory">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://data-proxy.ebrains.eu/${bucketName}`,
                          "_blank"
                        );
                      }}
                    >
                      <FolderRoundedIcon
                        sx={{ cursor: "pointer" }}
                        color="primary"
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                {projectIssue.loading && !projectIssue.problem ? (
                  renderProjectContent()
                ) : (
                  <List
                    sx={{
                      width: "100%",
                      "& .MuiListItem-root": {
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        mb: 1,
                        backgroundColor: "white",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                          transform: "translateX(4px)",
                        },
                      },
                    }}
                  >
                    {projects.map((project, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: 2,
                          py: 1,
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            sx={{
                              "&:hover": {
                                color: "error.main",
                                transform: "scale(1.1)",
                                backgroundColor: "transparent",
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              const confirmation = prompt(
                                `Type "${project.name}" to confirm deletion:`,
                                ""
                              );
                              if (confirmation === project.name) {
                                let deletingPath = `${bucketName}/${project.name}/`;

                                deleteItem(deletingPath, token)
                                  .then(() => {
                                    setTimeout(() => {
                                      fetchAndUpdateProjects(bucketName);
                                    }, 1500);
                                  })
                                  .catch((error) => {
                                    console.error(
                                      "Error deleting project:",
                                      error
                                    );
                                    alert("Failed to delete project");
                                  });
                              } else if (confirmation !== null) {
                                alert(
                                  "Project name didn't match. Deletion cancelled."
                                );
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        onClick={() => handleProjectSelect(project)}
                      >
                        <ListItemText primary={project.name} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
            <Box
              component="iframe"
              src="https://quint-webtools.readthedocs.io/en/latest/"
              sx={{
                display: "flex",
                flexGrow: 1.5,
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            ></Box>
          </Box>
        ) : (
          <>
            {updatingBrains ? (
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <CircularProgress size={24} />
                <Typography>Loading series...</Typography>
              </Box>
            ) : (
              <>
                <BrainTable
                  selectedProject={selectedProject}
                  rows={rows}
                  onBackClick={() => {
                    setWalnContent(null);
                    setSelectedProject(null);
                    setSelectedBrain(null);
                  }}
                  onAddBrainClick={handleOpenDialog}
                  onBrainSelect={handleBrainSelect}
                />
                <Box
                  sx={{
                    width: "60%",
                    ml: 2,
                    flexGrow: 0.6,
                    height: "100%",
                    flexDirection: "column",
                  }}
                >
                  <QuickActions
                    braininfo={selectedBrain}
                    stats={selectedBrainStats}
                    isLoading={isFetchingStats}
                    token={token}
                    setSelectedBrain={setSelectedBrain}
                    refreshBrain={refreshBrain}
                    refreshProjectBrains={refreshProjectBrains}
                  />
                  <ProgressPanel walnContent={walnContent} />
                </Box>
              </>
            )}
          </>
        )}
      </Box>

      <CreationDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        project={selectedProject}
        updateProjects={fetchAndUpdateProjects}
        token={token}
        brainEntries={projectBrainEntries}
        onUploadComplete={refreshProjectBrains}
      />
    </Box>
  );
}
