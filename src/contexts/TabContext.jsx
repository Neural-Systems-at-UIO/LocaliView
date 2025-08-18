import logger from "../utils/logger.js";
import React, { createContext, useContext, useState } from "react";

const TabContext = createContext();

export const TabProvider = ({ children }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [nativeSelection, setNativeSelection] = useState({
    native: true,
    app: "workspace",
  });
  const [currentUrl, setCurrentUrl] = useState(null);

  const handleFrameChange = (url) => {
    logger.debug("Changing frame", { url });
    setCurrentUrl(url);
    setNativeSelection({
      native: false,
      app: "frame",
    });
  };

  const switchToTab = (tabIndex) => {
    setCurrentTab(tabIndex);
  };

  const navigateToWebAlign = (customAlignment) => {
    const alignment = customAlignment || localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Updating localstorage in case the registrations are not the same
    if (
      customAlignment &&
      customAlignment !== localStorage.getItem("alignment")
    ) {
      localStorage.setItem("alignment", customAlignment);
    }

    // Tab index 1 is for WebAlign
    setCurrentTab(1);

    // Construct URL and set iframe
    const url = `https://webalign.apps.ebrains.eu/index.php?clb-collab-id=${bucketName}&filename=${alignment}`;
    handleFrameChange(url);

    return true;
  };

  const navigateToWebWarp = (customAlignment) => {
    const alignment = customAlignment || localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Updating localstorage in case the registrations are not the same
    if (
      customAlignment &&
      customAlignment !== localStorage.getItem("alignment")
    ) {
      localStorage.setItem("alignment", customAlignment);
    }

    // Tab index 2 is for WebWarp
    setCurrentTab(2);

    // Construct URL and set iframe
    const url = `https://webwarp.apps.ebrains.eu/webwarp.php?clb-collab-id=${bucketName}&filename=${alignment}`;
    handleFrameChange(url);

    return true;
  };

  const navigateToWebIlastik = () => {
    const alignment = localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");
    const mainPath = JSON.parse(localStorage.getItem("selectedBrain"));

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Tab index 3 is for WebIlastik
    setCurrentTab(3);

    // Use the provided paths or default to the main path
    const imagesPath = `${mainPath.path}/zipped_images/`;
    const segmentsPath = `${mainPath.path}/segmentations/`;

    const params = new URLSearchParams({
      ebrains_bucket_name: bucketName,
      ebrains_bucket_path: imagesPath,
      output_path_pattern: segmentsPath,
    });

    const url = `https://app.ilastik.org/public/nehuba/index.html?${params.toString()}#!%7B%22layout%22%3A%22xy%22%7D`;
    logger.debug("Ilastik URL", { url });
    handleFrameChange(url);

    return true;
  };

  const navigateToLocaliZoom = () => {
    // Current working registration as alignment
    const alignment = localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");

    // wtf it this?
    const driveId = localStorage.getItem("driveId"); // no idea what this is
    const token = localStorage.getItem("accessToken");
    // so this is driveId/filename xxx.lz?
    const docName = "5. Annotations and export of points with LocaliZoom";
    const filename = "my points.lz";

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Tab index is 3 in this case
    setCurrentTab(3);

    const queryObj = {
      app: "localizoom",
      "clb-collab-id": bucketName,
      // doc path will be bucket/project/.../something.lz
      "clb-doc-path": "",
      "clb-doc-name": docName,
      // "clb-drive-id": driveId,
      token: token,
      filename: filename,
    };

    const encodedQuery = encodeURIComponent(JSON.stringify(queryObj));
    const url = `https://webwarp.apps.ebrains.eu/filmstripzoom.html?${encodedQuery}`;
    logger.debug("LocaliZoom URL", { url });
    handleFrameChange(url);

    return true;
  };

  const navigateToWebNutil = () => {
    // Tab index 4 is for WebNutil
    setCurrentTab(4);
    // Construct URL and set iframe
    setNativeSelection({
      native: true,
      app: "nutil",
    });
    return true;
  };

  const natvigateToSandBox = () => {
    // Tab index 5 is for SandBox
    setCurrentTab(5);
    // Construct URL and set iframe
    setNativeSelection({
      native: true,
      app: "sandbox",
    });
    return true;
  };

  return (
    <TabContext.Provider
      value={{
        currentTab,
        switchToTab,
        navigateToWebAlign,
        navigateToWebWarp,
        nativeSelection,
        setNativeSelection,
        currentUrl,
        handleFrameChange,
        navigateToWebIlastik,
        navigateToWebNutil,
        navigateToLocaliZoom,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = () => useContext(TabContext);
