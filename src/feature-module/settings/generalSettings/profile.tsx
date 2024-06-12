import React from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
const route = all_routes;
const Profile = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            {/* Page Header */}
            <div className="page-header">
              <div className="row align-items-center">
                <div className="col-sm-4">
                  <h4 className="page-title">Settings</h4>
                </div>
                <div className="col-sm-8 text-sm-end">
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
                          <Link to={route.profile} className="active">
                            Profile
                          </Link>
                        </li>
                        <li>
                          <Link to={route.security}>Security</Link>
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
                  <div className="card-body">
                    <div className="settings-header">
                      <h4>Profile Settings</h4>
                    </div>
                    <div className="settings-form">
                      <form>
                        <div className="settings-sub-header">
                          <h6>Employee Information</h6>
                          <p>Provide the information below</p>
                        </div>
                        <div className="form-wrap">
                          <div className="profile-upload">
                            <div className="profile-upload-img">
                              <span>
                                <i className="ti ti-photo" />
                              </span>
                              <ImageWithBasePath
                                id="ImgPreview"
                                src="assets/img/profiles/avatar-02.jpg"
                                alt="img"
                                className="preview1"
                              />
                              <button
                                type="button"
                                id="removeImage1"
                                className="profile-remove"
                              >
                                <i className="feather-x" />
                              </button>
                            </div>
                            <div className="profile-upload-content">
                              <label className="profile-upload-btn">
                                <i className="ti ti-file-broken" /> Upload File
                                <input
                                  type="file"
                                  id="imag"
                                  className="input-img"
                                />
                              </label>
                              <p>JPG, GIF or PNG. Max size of 800K</p>
                            </div>
                          </div>
                        </div>
                        <div className="profile-details">
                          <div className="row">
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  First Name{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Last Name{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  User Name{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Phone Number{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Email <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="profile-address">
                          <div className="settings-sub-header">
                            <h6>Address</h6>
                            <p>Please enter the address details</p>
                          </div>
                          <div className="row">
                            <div className="col-md-12">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Address <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Country <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  State / Province{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  City <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Postal Code{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
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
                {/* /Settings Info */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
