import logger from "../utils/logger.js";
import { Alert } from "@mui/material";
import React, { createContext, useContext, useState } from "react";
import { Alert } from "@mui/material";

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  // User level states
  const [workspace, setWorkspace] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Project level entries
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [selectedBrainStats, setSelectedBrainStats] = useState([]);
  const [projectBrainEntries, setProjectBrainEntries] = useState(() => {
    try {
      const storedEntries = localStorage.getItem("projectBrainEntries");
      return storedEntries ? JSON.parse(storedEntries) : [];
    } catch (error) {
      logger.error("Error parsing projectBrainEntries", error);
      return [];
    }
  });

  // Current brain list entries

  // InfoMessage
  const [infoMessage, setInfoMessage] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        token,
        setToken,
        user,
        setUser,
        projects,
        setProjects,
        selectedProject,
        setSelectedProject,
        selectedBrain,
        setSelectedBrain,
        selectedBrainStats,
        setSelectedBrainStats,
        projectBrainEntries,
        setProjectBrainEntries,
      }}
    >
      {children}
      <Alert
        severity={infoMessage.severity}
        open={infoMessage.open}
        onClose={() => setInfoMessage({ ...infoMessage, open: false })}
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        {infoMessage.message}
      </Alert>
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  return useContext(WorkspaceContext);
};
