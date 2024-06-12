import React from "react";
import ALLRoutes from "./router/router";
import { useDispatch, useSelector } from "react-redux";
import { setThemeSettings } from "../core/data/redux/commonSlice";

const Feature = () => {

  const dispatch = useDispatch();
  const themeOpen = useSelector((state: any) => state?.themeSettings);
  const headerCollapse = useSelector((state: any) => state.headerCollapse);
  const mobileSidebar = useSelector((state: any) => state.mobileSidebar);
  const miniSidebar = useSelector((state: any) => state.miniSidebar);
  const expandMenu = useSelector((state: any) => state.expandMenu);
 

  return (
    <div>
       <div
        className={`main-wrapper 
        ${headerCollapse ? "header-collapse" : ""} 
        ${mobileSidebar ? "slide-nav" : ""}
        ${miniSidebar ? "mini-sidebar" : ""}
        ${expandMenu ? "expanded-menu" : ""}`}
      >
        <ALLRoutes />
      </div>
      <div className="sidebar-overlay"></div>
      <div
        className={`sidebar-themeoverlay ${themeOpen ? "open" : ""}`}
        onClick={() => dispatch(setThemeSettings(!themeOpen))}
      ></div>
    </div>
  );
};

export default Feature;
