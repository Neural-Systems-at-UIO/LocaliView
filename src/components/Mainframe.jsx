import React from "react";
import { Box } from "@mui/material";
import QuintTable from "./QuintTable";
import Nutil from "./Nutil";

const Mainframe = ({ url, native, token, user }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "96vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {native.native ? (
        <Box
          sx={{
            width: "99%",
            height: "98%",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {native.app === "workspace" ? (
            // .app helps figure the native selections we have
            <QuintTable token={token} user={user} />
          ) : native.app === "nutil" ? (
            <Nutil token={token} user={user} />
          ) : null}
        </Box>
      ) : (
        <Box
          component="iframe"
          sx={{
            width: "98%",
            height: "98%",
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
