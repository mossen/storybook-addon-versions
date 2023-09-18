import React from "react";
import { AddonPanel } from "@storybook/components";
import { PanelContent } from "./PanelContent";

interface PanelProps {
  active: boolean;
}

export const Panel: React.FC<PanelProps> = (props) => {
  return (
    <AddonPanel {...props}>
      <PanelContent active={props.active} location={window.parent.location} />
    </AddonPanel>
  );
};
