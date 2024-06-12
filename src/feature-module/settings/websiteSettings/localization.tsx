import React from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import CollapseHeader from "../../../core/common/collapse-header";

const Localization = () => {
  
  const languageOptions = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
  ];
  const timezoneOptions = [
    { value: "utc5:30", label: "UTC 5:30" },
    { value: "utc+11:00", label: "(UTC+11:00) INR" },
  ];
  const dateOptions = [
    { value: "22-Jul-2023", label: "22 Jul 2023" },
    { value: "Jul-22-2023", label: "Jul 22 2023" },
  ];
  const timeFormatOptions = [
    { value: "12-hours", label: "12 Hours" },
    { value: "24-hours", label: "24 Hours" },
  ];
  const yearOptions = [
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
  ];
  const monthOptions = [
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
  ];
  const country = [
    { value: "India", label: "India" },
    { value: "United States Of America", label: "United States Of America" },
  ];
  const symbols = [
    { value: "$", label: "$" },
    { value: "€", label: "€" },
    { value: "€", label: "€" },
  ];
  const symbolsandvalue = [
    { value: "$100", label: "$100" },
    { value: "$400", label: "$400" },
  ];
  const dot = [
    { value: ".", label: "." },
    { value: ".", label: "." },
  ];
  const comma = [
    { value: ",", label: "," },
    { value: ",", label: "," },
  ];
  const permissionforcountry = [
    { value: "Allow All Country", label: "Allow All Country" },
    { value: "Deny All Country", label: "Deny All Country" },
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
                      <Link to="/profile">
                        <i className="ti ti-settings-cog" /> General Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/company-settings" className="active">
                        <i className="ti ti-world-cog" /> Website Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/invoice-settings">
                        <i className="ti ti-apps" /> App Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/email-settings">
                        <i className="ti ti-device-laptop" /> System Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/payment-gateways">
                        <i className="ti ti-moneybag" /> Financial Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/storage">
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
                          <Link to="/company-settings">Company Settings</Link>
                        </li>
                        <li>
                          <Link to="/localization" className="active">
                            Localization
                          </Link>
                        </li>
                        <li>
                          <Link to="/prefixes">Prefixes</Link>
                        </li>
                        <li>
                          <Link to="/preference">Preference</Link>
                        </li>
                        <li>
                          <Link to="/appearance">Appearance</Link>
                        </li>
                        <li>
                          <Link to="/language">Language</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* /Settings Sidebar */}
              </div>
              <div className="col-xl-9 col-lg-12">
                {/* Prefixes */}
                <div className="card">
                  <div className="card-body settings-form">
                    <div className="settings-header">
                      <h4>Localization</h4>
                    </div>
                    <form>
                      <div className="settings-sub-header">
                        <h6>Basic Information</h6>
                        <p>Provide the basic information below</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Language</h6>
                              <p>Select Language of the website</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={languageOptions}
                                className="select"
                                placeholder="Select Language"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Language Switcher</h6>
                              <p>To display in all the pages</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <div className="status-toggle">
                                <input
                                  type="checkbox"
                                  id="prefer3"
                                  className="check"
                                  defaultChecked
                                />
                                <label
                                  htmlFor="prefer3"
                                  className="checktoggle"
                                >
                                  {" "}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Timezone</h6>
                              <p>Select date format to display in website</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={timezoneOptions}
                                className="select"
                                placeholder="Select Timezone"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Date Format</h6>
                              <p>Select Language of the website</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={dateOptions}
                                className="select"
                                placeholder="Select Date Format"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Time Format</h6>
                              <p>Select time format to display in website</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={timeFormatOptions}
                                className="select"
                                placeholder="Select Time Format"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Financial Year</h6>
                              <p>Select year for finance</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={yearOptions}
                                className="select"
                                placeholder="Select Year"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Starting Month</h6>
                              <p>Select starting month to display</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={monthOptions}
                                className="select"
                                placeholder="Select Month"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="settings-sub-header">
                        <h6>Currency Settings</h6>
                        <p>Provide the currency information below</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Currency</h6>
                              <p>Select currency</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={country}
                                className="select"
                                placeholder="Select Country"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Currency Symbol</h6>
                              <p>Select currency symbol</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={symbols}
                                className="select"
                                placeholder="Select Country"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Currency Position</h6>
                              <p>Select currency position</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={symbolsandvalue}
                                className="select"
                                placeholder="Select Country"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Decimal Seperator</h6>
                              <p>Select decimal seperator</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={dot}
                                className="select"
                                placeholder="."
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Thousand Seperator</h6>
                              <p>Select thousand seperator</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={comma}
                                className="select"
                                placeholder=","
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="settings-sub-header">
                        <h6>Country Settings</h6>
                        <p>Provide the country information below</p>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Countries Restriction</h6>
                              <p>Select restricted countries</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <Select
                                options={permissionforcountry}
                                className="select"
                                placeholder="Allow All Country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="settings-sub-header">
                        <h6>File Settings</h6>
                        <p>Provide the files information below</p>
                      </div>
                      <div className="profile-details border-0 mb-0">
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Allowed Files</h6>
                              <p>Select allowed files</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input
                                className="input-tags form-control"
                                type="text"
                                data-role="tagsinput"
                                name="Label"
                                defaultValue="JPG, PNG, GIF"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="setting-title">
                              <h6>Max File Size</h6>
                              <p>Select size of the files</p>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="5000MB"
                              />
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
                {/* /Prefixes */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Localization;
