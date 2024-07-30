import React from "react";
export type PageSettings = {
  path: string;
  exact?: boolean;
  component: React.FC | JSX.Element | React.Component;
  requiresInitialPayload?: boolean;
  label: string;
};
export type Pages = Record<string, PageSettings>;
