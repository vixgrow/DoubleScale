import React from "react";
import Select, { StylesConfig } from "react-select";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
const route = all_routes;
const InvoiceSettings = () => {
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

  const options1 = [
    { value: "5", label: "5" },
    { value: "7", label: "7" },
  ];

  const options2 = [
    { value: "roundoff-up", label: "Roundoff Up" },
    { value: "roundoff-down", label: "Roundoff Down" },
  ];
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
                      <Link to={route.invoiceSettings} className="active">
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
                      <h4>App Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.invoiceSettings} className="active">
                            Invoice Settings
                          </Link>
                        </li>
                        <li>
                          <Link to={route.printers}>Printer</Link>
                        </li>
                        <li>
                          <Link to={route.customFields}>Custom Fields</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* /Settings Sidebar */}
              </div>
              <div className="col-xl-9 col-lg-12">
                {/* Invoice Settings */}
                <div className="card">
                  <div className="card-body">
                    <div className="settings-header">
                      <h4>Invoice Settings</h4>
                    </div>
                    <div className="settings-form">
                      <form>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Invoice Logo</h6>
                              <p>
                                Upload logo of your company to display in
                                invoice
                              </p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <img
                                    id="ImgPreview"
                                    src="assets/img/logo.svg"
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
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input
                                      type="file"
                                      id="imag"
                                      className="input-img"
                                    />
                                  </label>
                                  <p>
                                    Upload Logo of your company to display in
                                    website(JPG or PNG). Max size of 800K
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Invoice Prefix</h6>
                              <p>Add prefix to your invoice</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="INV-"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Invoice Due</h6>
                              <p>Select due date to display in invoice</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <div className="d-flex align-items-center inv-days">
                                <div className="select-drop">
                                  <Select
                                    styles={customStyles}
                                    className="select"
                                    defaultValue={options1[0]}
                                    options={options1}
                                  />
                                </div>
                                <p>Days</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Invoice Round Off</h6>
                              <p>Value roundoff in invoice</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <div className="d-flex align-items-center round-off">
                                <div className="status-toggle">
                                  <input
                                    type="checkbox"
                                    id="roundoff"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="roundoff"
                                    className="checktoggle"
                                  >
                                    {" "}
                                  </label>
                                </div>
                                <div className="select-drop w-100">
                                  <Select
                                    styles={customStyles}
                                    className="select"
                                    defaultValue={options2[0]}
                                    options={options2}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Show Company Details</h6>
                              <p>Show/hide company details in invoice</p>
                            </div>
                          </div>
                          <div className="col-md-6">
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
                              <h6>Invoice Header Terms</h6>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              {" "}
                              <div className="summernote" />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="setting-title">
                              <h6>Invoice Footer Terms</h6>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="summernote" />
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
                {/* /Invoice Settings */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettings;
