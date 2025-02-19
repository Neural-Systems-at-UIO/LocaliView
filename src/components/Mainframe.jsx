import React from "react";
import { Box } from "@mui/material";
import QuintTable from "./QuintTable";
import Nutil from "./Nutil";

const Mainframe = ({ url, native, token, user }) => {
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
      {native.native ? (
        <Box
          sx={{
            width: "99%",
            height: "100%",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {native.app === "workspace" ? (
            <QuintTable token={token} user={user} />
          ) : native.app === "nutil" ? (
            <Nutil token={token} user={user} />
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
          src={url || ""}
          title="Mainframe Content"
          allowFullScreen
        />
      )}
    </Box>
  );
};

export default Mainframe;
