import React from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
const route = all_routes;
const Security = () => {
  return (
    <div>
      {/* Page Wrapper */}
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
                        <Link to={route.profile} className="active">
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
                        <Link to={route.emailSettings}>
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
                        <h4>General Settings</h4>
                        <ul>
                          <li>
                            <Link to={route.profile}>Profile</Link>
                          </li>
                          <li>
                            <Link to={route.security} className="active">
                              Security
                            </Link>
                          </li>
                          <li>
                            <Link to={route.notification}>Notifications</Link>
                          </li>
                          <li>
                            <Link to={route.connectedApps}>Connected Apps</Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* /Settings Sidebar */}
                </div>
                <div className="col-xl-9 col-lg-12">
                  {/* Settings Info */}
                  <div className="card">
                    <div className="card-body pb-0">
                      <div className="settings-header">
                        <h4>Security Settings</h4>
                      </div>
                      <div className="settings-form">
                        <div className="row">
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Password</h5>
                                </div>
                                <div className="security-content">
                                  <p>Last Changed 03 Jan 2023, 09:00 AM</p>
                                </div>
                              </div>
                              <div className="security-btn security-btn-info">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                  data-bs-toggle="modal"
                                  data-bs-target="#change_password"
                                >
                                  Change Password
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Two Factor</h5>
                                  <div className="status-toggle">
                                    <input
                                      id="two_factor"
                                      className="check"
                                      type="checkbox"
                                      defaultChecked
                                    />
                                    <label
                                      htmlFor="two_factor"
                                      className="checktoggle"
                                    >
                                      checkbox
                                    </label>
                                  </div>
                                </div>
                                <div className="security-content">
                                  <p>
                                    Receive codes via SMS or email every time
                                    you login
                                  </p>
                                </div>
                              </div>
                              <div className="security-btn security-btn-info">
                                <Link
                                  to="#"
                                  className="btn btn-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_two_factor"
                                >
                                  Delete Account
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Google Authenticator</h5>
                                  <div className="status-toggle">
                                    <input
                                      id="google_authenticator"
                                      className="check"
                                      type="checkbox"
                                      defaultChecked
                                    />
                                    <label
                                      htmlFor="google_authenticator"
                                      className="checktoggle"
                                    >
                                      checkbox
                                    </label>
                                  </div>
                                </div>
                                <div className="security-content">
                                  <p>
                                    Google Authenticator adds an extra layer of
                                    security to your online accounts by adding a
                                    second step of verification when you sign
                                    in.
                                  </p>
                                </div>
                              </div>
                              <div className="security-btn">
                                <span className="badge badge-light-success">
                                  Connected
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>
                                    Phone Number Verification{" "}
                                    <i className="ti ti-square-rounded-check-filled text-success" />
                                  </h5>
                                </div>
                                <div className="security-content">
                                  <p className="text-success-light">
                                    Verified Mobile Number :{" "}
                                    <span>+99264710583</span>
                                  </p>
                                </div>
                              </div>
                              <div className="security-btn  security-btn-info">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                  data-bs-toggle="modal"
                                  data-bs-target="#change_phone_number"
                                >
                                  Change
                                </Link>
                                <Link
                                  to="#"
                                  className="btn btn-remove"
                                >
                                  Remove
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>
                                    Email Verification{" "}
                                    <i className="ti ti-square-rounded-check-filled text-success" />
                                  </h5>
                                </div>
                                <div className="security-content">
                                  <p className="text-success-light">
                                    Verified Email :{" "}
                                    <span>info@example.com</span>
                                  </p>
                                </div>
                              </div>
                              <div className="security-btn security-btn-info">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                  data-bs-toggle="modal"
                                  data-bs-target="#change_email"
                                >
                                  Change
                                </Link>
                                <Link
                                  to="#"
                                  className="btn btn-remove"
                                >
                                  Remove
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Device Management</h5>
                                </div>
                                <div className="security-content">
                                  <p>Last Changed 17 Feb 2023, 11.00 AM</p>
                                </div>
                              </div>
                              <div className="security-btn security-btn-info">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                >
                                  Manage
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Account Activity</h5>
                                </div>
                                <div className="security-content">
                                  <p>Last Changed 22 Feb 2023, 01:20 PM</p>
                                </div>
                              </div>
                              <div className="security-btn">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Deactive Account</h5>
                                </div>
                                <div className="security-content">
                                  <p>Last Changed 04 Mar 2023, 08:40 AM</p>
                                </div>
                              </div>
                              <div className="security-btn">
                                <Link
                                  to="#"
                                  className="btn btn-light"
                                  data-bs-toggle="modal"
                                  data-bs-target="#deactive_account"
                                >
                                  Deactive
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-6 d-flex">
                            <div className="security-grid flex-fill">
                              <div className="security-header">
                                <div className="security-heading">
                                  <h5>Delete Account</h5>
                                </div>
                                <div className="security-content">
                                  <p>Last Changed 13 Mar 2023, 02:40 PM</p>
                                </div>
                              </div>
                              <div className="security-btn">
                                <Link
                                  to="#"
                                  className="btn btn-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_account"
                                >
                                  Delete Account
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Settings Info */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Change Password */}
      <div
        className="modal custom-modal fade"
        id="change_password"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 m-0 justify-content-end">
              <button
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Current Password <span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" />
                </div>
                <div className="modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Change Password */}
      {/* Delete Account */}
      <div
        className="modal custom-modal fade"
        id="delete_account"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 m-0 justify-content-end">
              <button
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="success-message text-center">
                <div className="success-popup-icon">
                  <i className="ti ti-trash-x" />
                </div>
                <h3>Delete Account</h3>
                <p className="del-info">Are you sure want to delete?</p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to={route.security} className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Account */}
    </div>
  );
};

export default Security;
