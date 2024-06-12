import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Scrollbars from "react-custom-scrollbars-2";
import { SidebarData } from "../../data/json/sidebarData";
import ImageWithBasePath from "../imageWithBasePath";
import { useDispatch, useSelector } from "react-redux";
import { setExpandMenu } from "../../data/redux/commonSlice";
import { all_routes } from "../../../feature-module/router/all_routes";

const Sidebar = () => {
  const Location = useLocation();
  const expandMenu = useSelector((state: any) => state.expandMenu);
  const dispatch = useDispatch();

  console.log("Location.pathname", Location.pathname);

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");

  const toggleSidebar = (title: any) => {
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: any) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };
  const toggle = () => {
    dispatch(setExpandMenu(expandMenu ? false : true));
  };

  return (
    <>
      <div
        className="sidebar"
        id="sidebar"
      // onMouseEnter={toggle}
      // onMouseLeave={toggle}
      >
        <Scrollbars>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                <li className="clinicdropdown">
                  <Link to="/profile">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-14.jpg"
                      className="img-fluid"
                      alt="Profile"
                    />
                    <div className="user-names">
                      <h5>Adrian Davies</h5>
                      <h6>Tech Lead</h6>
                    </div>
                  </Link>
                </li>
              </ul>

              <ul>
                {SidebarData?.map((mainLabel, index) => (
                  <li className="clinicdropdown" key={index}>
                    <h6 className="submenu-hdr">{mainLabel?.label}</h6>

                    <ul>
                      {mainLabel?.submenuItems?.map((title: any, i) => {
                        let link_array: any = [];
                        if ("submenuItems" in title) {
                          title.submenuItems?.map((link: any) => {
                            link_array.push(link?.link);
                            if (link?.submenu && "submenuItems" in link) {
                              link.submenuItems?.map((item: any) => {
                                link_array.push(item?.link);
                              });
                            }
                          });
                        }
                        title.links = link_array;

                        return (
                          <>
                            <li className="submenu" key={i}>
                              <Link
                                to={title?.link === all_routes.leadsDashboard ? "/jaganb" : title?.link}
                                onClick={() => toggleSidebar(title?.label)}
                                className={`${subOpen == title?.label
                                    ? "subdrop active"
                                    : ""
                                  } ${title?.links?.includes(Location.pathname)
                                    ? "active"
                                    : ""
                                  }
                            `}
                              >
                                {/* <Grid /> */}
                                <i className={title.icon}></i>

                                <span>{title?.label}</span>
                                <span
                                  className={title?.submenu ? "menu-arrow" : ""}
                                />
                              </Link>
                              <ul
                                style={{
                                  display:
                                    subOpen == title?.label ? "block" : "none",
                                }}
                              >
                                {title?.submenuItems?.map(
                                  (item: any, titleIndex: any) => (
                                    <li
                                      className="submenu submenu-two"
                                      key={titleIndex}
                                    >
                                      {item.lebel}
                                      <Link
                                        to={item?.link}
                                        className={
                                          item?.submenuItems
                                            ?.map((link: any) => link?.link)
                                            .includes(Location.pathname) ||
                                            item?.link == Location.pathname
                                            ? "active"
                                            : ""
                                        }
                                        onClick={() => {
                                          toggleSubsidebar(item?.label);
                                        }}
                                      >
                                        {item?.label}
                                        <span
                                          className={
                                            item?.submenu ? "menu-arrow" : ""
                                          }
                                        />
                                      </Link>
                                      <ul
                                        style={{
                                          display:
                                            subsidebar == item?.label
                                              ? "block"
                                              : "none",
                                        }}
                                      >
                                        {item?.submenuItems?.map(
                                          (items: any, titleIndex: any) => (
                                            <li key={titleIndex}>
                                              {/* {item.lebel} */}
                                              <Link
                                                to={items?.link}
                                                className={`${subsidebar == items?.label
                                                    ? "submenu-two subdrop"
                                                    : "submenu-two"
                                                  } ${items?.submenuItems
                                                    ?.map(
                                                      (link: any) => link.link
                                                    )
                                                    .includes(
                                                      Location.pathname
                                                    ) ||
                                                    items?.link ==
                                                    Location.pathname
                                                    ? "active"
                                                    : ""
                                                  }`}
                                              >
                                                {items?.label}
                                              </Link>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </li>
                                  )
                                )}
                              </ul>
                            </li>
                          </>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Scrollbars>
      </div>
    </>
  );
};

export default Sidebar;
