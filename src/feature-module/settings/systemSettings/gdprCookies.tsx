import React from "react";
import Select, { StylesConfig } from 'react-select';
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
const route = all_routes;
const GdprCookies = () => {
  const options = [
    { value: "right", label: "Right" },
    { value: "left", label: "Left" },
  ];
  const customStyles: StylesConfig = {
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#E41F07" : "#fff",
        color: state.isFocused ? "#fff" : "#000",
        "&:hover": {
            backgroundColor: "#E41F07",
        },
    }),
};
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            {/* Page Header */}
            <div className="page-header">
              <div className="row align-items-center">
                <div className="col-8">
                  <h4 className="page-title">Settings</h4>
                </div>
                <div className="col-4 text-end">
                  <div className="head-icons">
                    <CollapseHeader />
                  </div>
                </div>
              </div>
            </div>
            {/* /Page Header */}
            {/* Settings Menu */}
            <div className="card settings-tab">
              <div className="card-body pb-0">
                <div className="settings-menu">
                  <ul className="nav">
                    <li>
                      <Link to={route.profile}>
                        <i className="ti ti-settings-cog" /> General Settings
                      </Link>
                    </li>
                    <li>
                      <Link to={route.companySettings}>
                        <i className="ti ti-world-cog" /> Website Settings
                      </Link>
                    </li>
                    <li>
                      <Link to={route.invoiceSettings}>
                        <i className="ti ti-apps" /> App Settings
                      </Link>
                    </li>
                    <li>
                      <Link to={route.emailSettings} className="active">
                        <i className="ti ti-device-laptop" /> System Settings
                      </Link>
                    </li>
                    <li>
                      <Link to={route.paymentGateways}>
                        <i className="ti ti-moneybag" /> Financial Settings
                      </Link>
                    </li>
                    <li>
                      <Link to={route.storage}>
                        <i className="ti ti-flag-cog" /> Other Settings
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* /Settings Menu */}
            <div className="row">
              <div className="col-xl-3 col-lg-12 theiaStickySidebar">
                {/* Settings Sidebar */}
                <div className="card">
                  <div className="card-body">
                    <div className="settings-sidebar">
                      <h4>Other Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.emailSettings}>Email Settings</Link>
                        </li>
                        <li>
                          <Link to={route.smsGateways}>SMS Gateways</Link>
                        </li>
                        <li>
                          <Link to={route.gdprCookies} className="active">
                            GDPR Cookies
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* /Settings Sidebar */}
              </div>
              <div className="col-xl-9 col-lg-12">
                {/* GDPR Cookies */}
                <div className="card">
                  <div className="card-body">
                    <div className="settings-header">
                      <h4>GDPR Cookies</h4>
                    </div>
                    <div className="settings-form">
                      <form>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Cookies Content Text</h6>
                              <p>You can configure the text here</p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="summernote" />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Cookies Position</h6>
                              <p>You can configure the type</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select styles={customStyles}
                                className="select"
                                defaultValue={options[0]}
                                options={options}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Agree Button Text</h6>
                              <p>You can configure the text here</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Manage"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Decline Button Text</h6>
                              <p>You can configure the text here</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Manage"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Show Decline Button</h6>
                              <p>To display decline button</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <div className="status-toggle">
                                <input
                                  type="checkbox"
                                  id="sms1"
                                  className="check"
                                  defaultChecked
                                />
                                <label htmlFor="sms1" className="checktoggle">
                                  {" "}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Link for Cookies Page</h6>
                              <p>You can configure the link here</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                        <div className="submit-button">
                          <Link to="#" className="btn btn-light">
                            Cancel
                          </Link>
                          <button type="submit" className="btn btn-primary">
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                {/* /GDPR Cookies */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GdprCookies;
