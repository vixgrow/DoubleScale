import React from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header";

const CompanySettings = () => {
  const route = all_routes;
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
                      <Link to={route.companySettings} className="active">
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
                      <h4>Website Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.companySettings} className="active">
                            Company Settings
                          </Link>
                        </li>
                        <li>
                          <Link to={route.localization}>Localization</Link>
                        </li>
                        <li>
                          <Link to={route.prefixes}>Prefixes</Link>
                        </li>
                        <li>
                          <Link to={route.preference}>Preference</Link>
                        </li>
                        <li>
                          <Link to={route.appearance}>Appearance</Link>
                        </li>
                        <li>
                          <Link to={route.language}>Language</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* /Settings Sidebar */}
              </div>
              <div className="col-xl-9 col-lg-12">
                {/* Company Settings */}
                <div className="card">
                  <div className="card-body settings-form">
                    <div className="settings-header">
                      <h4>Company Settings</h4>
                    </div>
                    <form>
                      <div className="settings-sub-header">
                        <h6>Company Information</h6>
                        <p>Provide the company information below</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Name{" "}
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Email Address
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Phone Number
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">Fax</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">Website</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="settings-sub-header">
                        <h6>Company Images</h6>
                        <p>Provide the company images</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    alt="img"
                                    className="preview1"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="feather-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>
                                    Upload Logo of your company to display in
                                    website. JPG or PNG. Max size of 800K
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    alt="img"
                                    className="preview1"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="feather-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>
                                    Upload Logo of your company to display in
                                    website. JPG or PNG. Max size of 800K
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    alt="img"
                                    className="preview1"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="feather-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>
                                    Upload Logo of your company to display in
                                    website. JPG or PNG. Max size of 800K
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    alt="img"
                                    className="preview1"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="feather-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>
                                    Upload Logo of your company to display in
                                    website. JPG or PNG. Max size of 800K
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="settings-sub-header">
                        <h6>Address</h6>
                        <p>Please enter the company address details</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">Address</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-xl-3 col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">Country</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-xl-3 col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                State / Province
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-xl-3 col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">Fax</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-xl-3 col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Postal Code
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
                {/* /Company Settings */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
