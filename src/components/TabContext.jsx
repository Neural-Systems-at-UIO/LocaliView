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
    console.log(`Changing frame to ${url}`);
    setCurrentUrl(url);
    setNativeSelection({
      native: false,
      app: "frame",
    });
  };

  const switchToTab = (tabIndex) => {
    setCurrentTab(tabIndex);
  };

  const navigateToWebAlign = () => {
    const alignment = localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Tab index 1 is for WebAlign
    setCurrentTab(1);

    // Construct URL and set iframe
    const url = `https://webalign.apps.ebrains.eu/index.php?clb-collab-id=${bucketName}&filename=${alignment}`;
    handleFrameChange(url);

    return true;
  };

  const navigateToWebWarp = () => {
    const alignment = localStorage.getItem("alignment");
    const bucketName = localStorage.getItem("bucketName");

    if (!alignment || alignment === "") {
      alert("Please set a working alignment first");
      return false;
    }

    // Tab index 2 is for WebWarp
    setCurrentTab(2);

    // Construct URL and set iframe
    const url = `https://webwarp.apps.ebrains.eu/webwarp.php?clb-collab-id=${bucketName}&filename=${alignment}`;
    handleFrameChange(url);

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
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = () => useContext(TabContext);
