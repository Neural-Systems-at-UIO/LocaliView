import React from "react";
import { Box } from "@mui/material";
import QuintTable from "./QuintTable";
import Nutil from "./Nutil";
import Sandbox from "./Sandbox";
import { useTabContext } from "../contexts/TabContext";

const Mainframe = ({ token, user }) => {
  const { currentUrl, nativeSelection } = useTabContext();
  return (
    <Box
      sx={{
        width: "100%",
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        mt: 1,
      }}
    >
      {nativeSelection.native ? (
        <Box
          sx={{
            width: "99%",
            height: "100%",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {nativeSelection.app === "workspace" ? (
            <QuintTable token={token} user={user} />
          ) : nativeSelection.app === "nutil" ? (
            <Nutil token={token} user={user} />
          ) : nativeSelection.app === "sandbox" ? (
            <Sandbox token={token} />
          ) : null}
        </Box>
      ) : (
        <Box
          component="iframe"
          sx={{
            width: "99%",
            height: "100%",
            border: "none",
            bgcolor: "white",
            borderRadius: "4px",
          }}
          src={currentUrl || ""}
          title="Mainframe Content"
          allowFullScreen
        />
      )}
    </Box>
  );
};

export default Mainframe;
