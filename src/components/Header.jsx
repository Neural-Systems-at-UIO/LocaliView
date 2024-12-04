import React, { useEffect, useState } from "react";
import {
  AppBar,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Toolbar,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";

import Mainframe from "./Mainframe";
import callUser from "../actions/createUser";

// Variable loading for URLs
const WEBALIGN_URL = import.meta.env.VITE_APP_WEBALIGN_URL;
const WEBWARP_URL = import.meta.env.VITE_APP_WEBWARP_URL;
const WEBNUTIL_URL = import.meta.env.VITE_APP_WEBNUTIL_URL;
const FILECREATOR = import.meta.env.VITE_APP_FILECREATOR_URL;
const LOCALIZOOM = import.meta.env.VITE_APP_LOCALIZOOM_URL;
const FAPI_URL = import.meta.env.VITE_APP_FAPI_URL;
const OIDC = import.meta.env.VITE_APP_OIDC;
const USER_INFO_URL = import.meta.env.VITE_APP_USER_INFO_URL;

const tabs = [
  {
    label: "Projects",
    url: null,
    disabled: false,
  },
  {
    label: "WebAlign",
    url: "https://webalign.apps.ebrains.eu/index.php",
    disabled: false,
  },
  {
    label: "WebWarp",
    url: WEBWARP_URL,
    disabled: false,
  },
  {
    label: "WebIlastik",
    url: WEBWARP_URL,
    disabled: false,
  },
  {
    label: "WebNutil",
    url: WEBNUTIL_URL,
    disabled: false,
  },
];

console.log(`You are running this application in ${process.env.NODE_ENV} mode`);

console.log(`Logging in`);

const Header = () => {
  const [auth, setAuth] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Control for the iframe, further divergence from an iframe can be done within the Mainframe component
  // Mainly for Native use of the applications and the webalign etc i frame ones
  const [currentUrl, setCurrentUrl] = useState(null);
  const [nativeSelection, setNativeSelection] = useState(true);
  const [tab, setTab] = useState(0);

  // Login alert
  const [loginAlert, setLoginAlert] = useState(true);

  const handleLogin = () => {
    window.location.href = `${OIDC}?response_type=code&login=true&client_id=quintweb&redirect_uri=https://127.00.0.1:3000`;
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleFrameChange = (url) => {
    console.log(`Changing frame to ${url}`);
    setCurrentUrl(url);
    setNativeSelection(false);
  };

  const handleNativeChange = () => {
    setNativeSelection(!nativeSelection);
  };

  const getBucketName = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    console.log(userInfo);
    const userName = userInfo.username;
    const collabName = `${userName}-rwb`;
    return collabName;
  };

  const sharedListItemSx = {
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      cursor: "pointer",
    },
  };

  // OnMount for all logins etc.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      fetch(`${FAPI_URL}token/dev?code=${code}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setToken(data.token.access_token);
          setLoginAlert(false);
        })
        // clean the url
        .then(window.history.replaceState(null, null, window.location.pathname))
        .catch((error) => console.error("Token couldn't be retrieved", error));
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const userInfo = await callUser(token);
        setUser(userInfo);
        setAuth(true);
      } catch (error) {
        console.error("User couldn't be retrieved", error);
        setAuth(false);
        setUser(null);
      }
    };

    fetchUser();
  }, [token]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#f0f0f0",
          color: "black",
          boxShadow: "none",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: "36px !important",
            py: 0,
            px: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Tabs
              value={tab}
              onChange={(event, newValue) => setTab(newValue)}
              sx={{
                minHeight: "36px",
                "& .MuiTab-root": {
                  minHeight: "36px",
                  fontSize: "0.875rem",
                  padding: "0 16px",
                  minWidth: "auto",
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                  "&.Mui-selected": {
                    color: "primary.main",
                    opacity: 1,
                    backgroundColor: "transparent",
                  },
                  "&:hover": {
                    opacity: 1,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: "2px",
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  disabled={tab.disabled}
                  onClick={() => {
                    switch (tab.label) {
                      case "Projects":
                        handleNativeChange();
                        break;
                      case "WebAlign":
                        let url = tab.url + `?clb-collab-id=${getBucketName()}`;
                        handleFrameChange(url);
                        break;
                      default:
                        handleFrameChange(tab.url);
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 18,
              }}
            >
              rodent workbench
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Account, settings and FAQ">
              <Button
                onClick={user ? toggleDrawer : handleLogin}
                sx={{
                  textAlign: "right",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "text.primary",
                  textTransform: "none", // Prevents default button text uppercase
                  padding: 0,
                  "& .MuiTypography-root": {
                    variant: "body2",
                  },
                }}
              >
                {user?.username || "Login"}
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
        <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
          <Box
            sx={{
              width: 280,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            role="presentation"
          >
            <List>
              <ListItem sx={sharedListItemSx}>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                {
                  <ListItemText
                    primary={user?.fullname}
                    secondary={user?.email}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                    }}
                  />
                }
              </ListItem>
              <ListItem sx={sharedListItemSx}>
                <ListItemIcon>
                  <CloudDownloadIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Download Example Dataset"
                  primaryTypographyProps={{
                    variant: "body2",
                    color: "text.primary",
                  }}
                />
              </ListItem>
              <ListItem
                sx={sharedListItemSx}
                onClick={() =>
                  window.open("https://www.ebrains.eu/contact/", "_blank")
                }
              >
                <ListItemIcon>
                  <HelpRoundedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Contact Us"
                  primaryTypographyProps={{
                    variant: "body2",
                    color: "text.primary",
                  }}
                />
              </ListItem>
              <ListItem sx={sharedListItemSx} onClick={() => handleLogin()}>
                <ListItemText primary="Login again" />
              </ListItem>
            </List>
            <Box sx={{ padding: "16px", marginTop: "auto" }}>
              <Typography variant="body2" color="textSecondary">
                Rodent Workbench v1.0.0, UiO 2024
              </Typography>
            </Box>
          </Box>
        </Drawer>
      </AppBar>
      <Mainframe url={currentUrl} native={nativeSelection} token={token} />
      <Snackbar
        open={loginAlert}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="info" sx={{ width: "100%" }} elevation={6}>
          Please login to access the Rodent Workbench and the EBrains services
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Header;
