import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  fetchBucketDir,
  fetchBrainStats,
  createProject,
  checkBucketExists,
  downloadWalnJson,
} from "../actions/handleCollabs";

const WorkspaceContext = createContext();

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children, token, user }) {
  // Core workspace state
  const [bucketName, setBucketName] = useState(
    () => localStorage.getItem("bucketName") || null
  );
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const storedProject = localStorage.getItem("selectedProject");
      return storedProject ? JSON.parse(storedProject) : null;
    } catch (error) {
      console.error("Error parsing selectedProject:", error);
      return null;
    }
  });

  // Brain-related state
  const [projectBrainEntries, setProjectBrainEntries] = useState(() => {
    try {
      const storedEntries = localStorage.getItem("projectBrainEntries");
      return storedEntries ? JSON.parse(storedEntries) : [];
    } catch (error) {
      console.error("Error parsing projectBrainEntries:", error);
      return [];
    }
  });

  const [selectedBrain, setSelectedBrain] = useState(() => {
    try {
      const storedBrain = localStorage.getItem("selectedBrain");
      return storedBrain ? JSON.parse(storedBrain) : null;
    } catch (error) {
      console.error("Error parsing selectedBrain:", error);
      return null;
    }
  });

  const [selectedBrainStats, setSelectedBrainStats] = useState([]);
  const [walnContent, setWalnContent] = useState(null);

  // UI state
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [updatingBrains, setUpdatingBrains] = useState(false);
  const [workspaceIssue, setWorkspaceIssue] = useState({
    problem: false,
    message: "",
    severity: "info",
    loading: false,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Current working alignment
  const [alignment, setAlignment] = useState(
    localStorage.getItem("alignment") || null
  );

  // Initialize the workspace
  useEffect(() => {
    if (!token || !user) return;

    const initializeWorkspace = async () => {
      try {
        setWorkspaceIssue({
          problem: false,
          message: "Initializing workspace...",
          severity: "info",
          loading: true,
        });

        const userName = user.username;
        const collabName = `rwb-${userName}`;

        // Check if bucket exists
        const bucketExists = await checkBucketExists(token, collabName);

        if (bucketExists) {
          console.log("Bucket already exists");
          setBucketName(collabName);
          localStorage.setItem("bucketName", collabName);
        } else {
          try {
            // Initialize a new bucket
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
              localStorage.setItem("bucketName", collabName);
            } else {
              throw new Error("Failed to initialize collab");
            }
          } catch (error) {
            console.error("Error initializing collab:", error);
            setWorkspaceIssue({
              problem: true,
              message: "Failed to initialize collab",
              severity: "error",
              loading: false,
            });
          }
        }

        setWorkspaceIssue({
          problem: false,
          message: "",
          severity: "info",
          loading: false,
        });
      } catch (error) {
        console.error("Error initializing workspace:", error);
        setWorkspaceIssue({
          problem: true,
          message: "Failed to initialize workspace",
          severity: "error",
          loading: false,
        });
      }
    };

    initializeWorkspace();
  }, [token, user]);

  // Fetch projects when we have token and bucketName
  useEffect(() => {
    if (token && bucketName && projects.length === 0) {
      fetchProjects();
    }
  }, [token, bucketName]);

  // WORKSPACE MANAGEMENT FUNCTIONS

  const fetchProjects = useCallback(async () => {
    if (!token || !bucketName) return;

    setWorkspaceIssue({
      problem: false,
      message: "Loading projects...",
      severity: "info",
      loading: true,
    });

    try {
      const fetchedProjects = await fetchBucketDir(
        token,
        bucketName,
        null,
        "/"
      );
      console.log("Fetched projects:", fetchedProjects);
      setProjects(fetchedProjects || []);

      setWorkspaceIssue({
        problem: false,
        message: "",
        severity: "info",
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      setWorkspaceIssue({
        problem: true,
        message: "Failed to fetch projects",
        severity: "error",
        loading: false,
      });
    }
  }, [token, bucketName]);

  const createNewProject = useCallback(
    async (projectName) => {
      if (!token || !bucketName || !projectName) return null;

      try {
        setWorkspaceIssue({
          problem: false,
          message: "Creating project...",
          severity: "info",
          loading: true,
        });

        const result = await createProject({
          token: token,
          bucketName: bucketName,
          projectName: projectName,
        });

        console.log("Project created:", result);
        await fetchProjects();

        return result;
      } catch (error) {
        console.error("Error creating project:", error);
        setWorkspaceIssue({
          problem: true,
          message: "Failed to create project",
          severity: "error",
          loading: false,
        });
        return null;
      }
    },
    [token, bucketName, fetchProjects]
  );

  // PROJECT MANAGEMENT FUNCTIONS

  const selectProject = useCallback(
    async (project) => {
      setSelectedProject(project);
      localStorage.setItem("selectedProject", JSON.stringify(project));
      setUpdatingBrains(true);

      // Clear brain selection when changing projects
      setSelectedBrain(null);
      localStorage.removeItem("selectedBrain");
      setWalnContent(null);

      if (project === null) {
        setProjectBrainEntries([]);
        localStorage.removeItem("projectBrainEntries");
        setUpdatingBrains(false);
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

        setProjectBrainEntries(brainEntries);
        localStorage.setItem(
          "projectBrainEntries",
          JSON.stringify(brainEntries)
        );
      } catch (error) {
        console.error("Error fetching brain entries:", error);
        setProjectBrainEntries([]);
        localStorage.removeItem("projectBrainEntries");
      } finally {
        setUpdatingBrains(false);
      }
    },
    [token, bucketName]
  );

  const refreshProject = useCallback(async () => {
    if (selectedProject) {
      await selectProject(selectedProject);
    }
  }, [selectedProject, selectProject]);

  // BRAIN MANAGEMENT FUNCTIONS

  const selectBrain = useCallback(
    async (brain) => {
      if (!brain) {
        setSelectedBrain(null);
        setSelectedBrainStats([]);
        setWalnContent(null);
        localStorage.removeItem("selectedBrain");
        return;
      }

      setSelectedBrain(brain);
      localStorage.setItem(
        "selectedBrain",
        JSON.stringify({
          ...brain,
          project: selectedProject?.name,
        })
      );

      setIsFetchingStats(true);

      try {
        const stats = await fetchBrainStats(token, bucketName, brain.path);
        setSelectedBrainStats(stats);

        // Check for WALN file and load it if available
        if (stats && stats[2]?.jsons?.[0]?.name) {
          try {
            const walnData = await downloadWalnJson(
              token,
              bucketName,
              stats[2].jsons[0].name
            );
            setWalnContent(walnData);
          } catch (error) {
            console.error("Failed to download WALN:", error);
            setWalnContent(null);
          }
        } else {
          setWalnContent(null);
        }
      } catch (error) {
        console.error("Error fetching brain stats:", error);
        setSelectedBrainStats([]);
        setWalnContent(null);
      } finally {
        setIsFetchingStats(false);
      }
    },
    [token, bucketName, selectedProject]
  );

  const refreshBrain = useCallback(async () => {
    if (selectedBrain) {
      await selectBrain(selectedBrain);
    }
  }, [selectedBrain, selectBrain]);

  // ALIGNMENT MANAGEMENT FUNCTIONS

  const setWorkingAlignment = useCallback((alignmentPath) => {
    setAlignment(alignmentPath);
    localStorage.setItem("alignment", alignmentPath);
  }, []);

  // Build the context value
  const value = {
    // Core state
    bucketName,
    projects,
    selectedProject,
    projectBrainEntries,
    selectedBrain,
    selectedBrainStats,
    walnContent,
    alignment,

    // UI state
    isFetchingStats,
    updatingBrains,
    workspaceIssue,
    isProcessing,
    setIsProcessing,

    // Workspace management
    fetchProjects,
    createNewProject,

    // Project management
    selectProject,
    refreshProject,

    // Brain management
    selectBrain,
    refreshBrain,

    // Alignment management
    setWorkingAlignment,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
