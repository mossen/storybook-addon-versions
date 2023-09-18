import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import getConfig from "../utils/config";
import generateLink from "../utils/generateLink";

export const PanelContent = ({ location, active }: {location: any, active: boolean}) => {
  const [availableVersions, setAvailableVersions] = useState();
  const [currentVersion, setCurrentVersion] = useState("");
  const [hostname, setHostName] = useState("");
  const [localhost, setLocalhost] = useState("");

  useEffect(() => {
    getConfig()
      .then((data:any) => {
        const { availableVersions, regex, hostname, localhost } = data; // eslint-disable-line

        if (availableVersions) {
          setAvailableVersions(availableVersions.reverse());
        }

        const url = location;
        let curVer = "";
        const path = url.pathname;
        if (path && path !== "/" && regex) {
          const r = new RegExp(regex, "i");
          const result = r.exec(path);
          if (result && result.length > 0) {
            curVer = result[1]; // eslint-disable-line
          }
        }

        setCurrentVersion(curVer);
        setHostName(hostname);
        setLocalhost(localhost);
      })
      .catch(() => {
        // Ignore, we're not showing anything anyway.
      });
  }, []);

  const handleVersionClick = (e: any) => {
    // We need to handle clicks dynamically so we get all the correct query strings
    const version = e.target.value;
    const targetHost = version
      ? hostname || `${location.hostname}:${location.port}`
      : localhost;
    const target = generateLink(location, currentVersion, version, targetHost);
    window.parent.location = target;
  };

  let versionsList = <p>No versions found</p>;

  if (availableVersions) {
    (versionsList as any) = (availableVersions as string[]).map(
      (version: string, index) => {
        if (currentVersion === version) {
          return (
            <span className="dark-bg with-border" key={`${version}-${index}`}>
              {version}
            </span>
          );
        }
        return (
          <button
            type="button"
            key={`${version}-${index}`}
            onClick={handleVersionClick}
            className="light-bg with-border"
            value={version}
          >
            {version}
          </button>
        );
      }
    );
  }

  return active ? (
    <div className="versions-panel-container">
      <div className="versions-panel-list">{versionsList}</div>
    </div>
  ) : null;
};

PanelContent.propTypes = {
  // channel: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  active: PropTypes.bool,
};
