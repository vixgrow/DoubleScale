import React from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header";

const Language = () => {
  const route = all_routes;
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
                            <Link to={route.companySettings}>Company Settings</Link>
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
                            <Link to={route.language} className="active">
                              Language
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* /Settings Sidebar */}
                </div>
                <div className="col-xl-9 col-lg-12">
                  {/* Custom Fields */}
                  <div className="card">
                    <div className="card-body">
                      <div className="settings-header">
                        <h4>Language</h4>
                      </div>
                      {/* Search */}
                      <div className="search-section">
                        <div className="row">
                          <div className="col-xl-3 col-md-3 col-lg-5">
                            <div className="form-wrap icon-form">
                              <span className="form-icon">
                                <i className="ti ti-search" />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search Language"
                              />
                            </div>
                          </div>
                          <div className="col-xl-9 col-md-9 col-lg-12">
                            <div className="export-list text-xl-end text-md-end text-lg-start">
                              <ul>
                                <li>
                                  <div className="export-dropdwon">
                                    <Link
                                      to="#"
                                      className="dropdown-toggle"
                                      data-bs-toggle="dropdown"
                                    >
                                      <i className="ti ti-package-export" />
                                      Export
                                    </Link>
                                    <div className="dropdown-menu  dropdown-menu-end">
                                      <ul>
                                        <li>
                                          <Link to="#">
                                            <i className="ti ti-file-type-pdf text-danger" />
                                            Export as PDF
                                          </Link>
                                        </li>
                                        <li>
                                          <Link to="#">
                                            <i className="ti ti-file-type-xls text-green" />
                                            Export as Excel{" "}
                                          </Link>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </li>
                                <li>
                                  <Link
                                    to="#"
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#import_sample"
                                  >
                                    <i className="ti ti-download" />
                                    Import Sample
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    to="#"
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_translation"
                                  >
                                    <i className="ti ti-square-rounded-plus" />
                                    Add Translation
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Search */}
                      {/* Filter */}
                      <div className="filter-section filter-flex">
                        <div className="sortby-list">
                          <ul>
                            <li>
                              <div className="sort-dropdown drop-down">
                                <Link
                                  to="#"
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                >
                                  <i className="ti ti-sort-ascending-2" />
                                  Sort{" "}
                                </Link>
                                <div className="dropdown-menu  dropdown-menu-start">
                                  <ul>
                                    <li>
                                      <Link to="#">
                                        <i className="ti ti-circle-chevron-right" />
                                        Ascending
                                      </Link>
                                    </li>
                                    <li>
                                      <Link to="#">
                                        <i className="ti ti-circle-chevron-right" />
                                        Descending
                                      </Link>
                                    </li>
                                    <li>
                                      <Link to="#">
                                        <i className="ti ti-circle-chevron-right" />
                                        Recently Viewed
                                      </Link>
                                    </li>
                                    <li>
                                      <Link to="#">
                                        <i className="ti ti-circle-chevron-right" />
                                        Recently Added
                                      </Link>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <div className="filter-list">
                          <ul>
                            <li>
                              <div className="manage-dropdwon">
                                <Link
                                  to="#"
                                  className="btn btn-purple-light"
                                  data-bs-toggle="dropdown"
                                  data-bs-auto-close="false"
                                >
                                  <i className="ti ti-columns-3" />
                                  Manage Columns
                                </Link>
                                <div className="dropdown-menu  dropdown-menu-md-end">
                                  <h4>Want to manage datatables?</h4>
                                  <p>
                                    Please drag and drop your column to reorder
                                    your table and enable see option as you
                                    want.
                                  </p>
                                  <ul>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Language
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-name"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-name"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Code
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-phone"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-phone"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        RTL
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-email"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-email"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Total
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-tag"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-tag"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Done
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-loc"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-loc"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Progress
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-rate"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-rate"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Status
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-status"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-status"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                    <li>
                                      <p>
                                        <i className="ti ti-grip-vertical" />
                                        Action
                                      </p>
                                      <div className="status-toggle">
                                        <input
                                          type="checkbox"
                                          id="col-action"
                                          className="check"
                                        />
                                        <label
                                          htmlFor="col-action"
                                          className="checktoggle"
                                        />
                                      </div>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                      {/* /Filter */}
                      {/* Contact List */}
                      <div className="table-responsive custom-table">
                        <table
                          className="table dataTable no-footer"
                          id="language-list"
                          style={{ width: "974px" }}
                        >
                          <thead className="thead-light">
                            <tr>
                              <th
                                className="no-sort sorting sorting_asc"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label=": activate to sort column descending"
                                style={{ width: "11px" }}
                                aria-sort="ascending"
                              />
                              <th
                                className="no-sort sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label=": activate to sort column ascending"
                                style={{ width: "2px" }}
                              />
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Language: activate to sort column ascending"
                                style={{ width: "77px" }}
                              >
                                Language
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Code: activate to sort column ascending"
                                style={{ width: "35px" }}
                              >
                                Code
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="RTL: activate to sort column ascending"
                                style={{ width: "25px" }}
                              >
                                RTL
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Total: activate to sort column ascending"
                                style={{ width: "33px" }}
                              >
                                Total
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Done: activate to sort column ascending"
                                style={{ width: "36px" }}
                              >
                                Done
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Progress: activate to sort column ascending"
                                style={{ width: "102px" }}
                              >
                                Progress
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Status: activate to sort column ascending"
                                style={{ width: "50px" }}
                              >
                                Status
                              </th>
                              <th
                                className="sorting"
                                tabIndex={0}
                                aria-controls="language-list"
                                rowSpan={1}
                                colSpan={1}
                                aria-label="Action: activate to sort column ascending"
                                style={{ width: "223px" }}
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="odd">
                              <td className="sorting_1">
                                <label className="checkboxs">
                                  <input type="checkbox" />
                                  <span className="checkmarks" />
                                </label>
                              </td>
                              <td>
                                <div className="set-star rating-select">
                                  <i className="fa fa-star" />
                                </div>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to="#"
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/flag-01.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to="#"
                                    className="profile-split d-flex flex-column"
                                  >
                                    English
                                  </Link>
                                </h2>
                              </td>
                              <td>en</td>
                              <td>
                                <div className="status-toggle">
                                  <input
                                    type="checkbox"
                                    id="English"
                                    className="check"
                                  />
                                  <label
                                    htmlFor="English"
                                    className="checktoggle"
                                  >
                                    /label&gt;
                                  </label>
                                </div>
                              </td>
                              <td>3481</td>
                              <td>2861</td>
                              <td>
                                <div className="pipeline-progress d-flex align-items-center">
                                  <div className="progress">
                                    <div
                                      className="progress-bar progress-bar-warning"
                                      role="progressbar"
                                    />
                                  </div>
                                  <span>80%</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-pill badge-status bg-success">
                                  Active
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <ul className="lang-type">
                                    <li>
                                      <Link to={route.languageWeb}>Web</Link>
                                    </li>
                                    <li>
                                      <Link to="#">App</Link>
                                    </li>
                                    <li>
                                      <Link to="#">Admin</Link>
                                    </li>
                                  </ul>
                                  <div className="dropdown table-action">
                                    <Link
                                      to="#"
                                      className="action-icon "
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fa fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_translation"
                                      >
                                        <i className="ti ti-edit text-blue" />{" "}
                                        Edit
                                      </Link>
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_translation"
                                      >
                                        <i className="ti ti-trash text-danger" />{" "}
                                        Delete
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr className="even">
                              <td className="sorting_1">
                                <label className="checkboxs">
                                  <input type="checkbox" />
                                  <span className="checkmarks" />
                                </label>
                              </td>
                              <td>
                                <div className="set-star rating-select">
                                  <i className="fa fa-star" />
                                </div>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to="#"
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/flag-02.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to="#"
                                    className="profile-split d-flex flex-column"
                                  >
                                    Arabic
                                  </Link>
                                </h2>
                              </td>
                              <td>ar</td>
                              <td>
                                <div className="status-toggle">
                                  <input
                                    type="checkbox"
                                    id="Arabic"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="Arabic"
                                    className="checktoggle"
                                  >
                                    /label&gt;
                                  </label>
                                </div>
                              </td>
                              <td>4815</td>
                              <td>4815</td>
                              <td>
                                <div className="pipeline-progress d-flex align-items-center">
                                  <div className="progress">
                                    <div
                                      className="progress-bar progress-bar-success"
                                      role="progressbar"
                                    />
                                  </div>
                                  <span>100%</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-pill badge-status bg-success">
                                  Active
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <ul className="lang-type">
                                    <li>
                                      <Link to={route.languageWeb}>Web</Link>
                                    </li>
                                    <li>
                                      <Link to="#">App</Link>
                                    </li>
                                    <li>
                                      <Link to="#">Admin</Link>
                                    </li>
                                  </ul>
                                  <div className="dropdown table-action">
                                    <Link
                                      to="#"
                                      className="action-icon "
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fa fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_translation"
                                      >
                                        <i className="ti ti-edit text-blue" />{" "}
                                        Edit
                                      </Link>
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_translation"
                                      >
                                        <i className="ti ti-trash text-danger" />{" "}
                                        Delete
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr className="odd">
                              <td className="sorting_1">
                                <label className="checkboxs">
                                  <input type="checkbox" />
                                  <span className="checkmarks" />
                                </label>
                              </td>
                              <td>
                                <div className="set-star rating-select">
                                  <i className="fa fa-star" />
                                </div>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to="#"
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/flag-03.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to="#"
                                    className="profile-split d-flex flex-column"
                                  >
                                    Chinese
                                  </Link>
                                </h2>
                              </td>
                              <td>zh</td>
                              <td>
                                <div className="status-toggle">
                                  <input
                                    type="checkbox"
                                    id="Chinese"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="Chinese"
                                    className="checktoggle"
                                  >
                                    /label&gt;
                                  </label>
                                </div>
                              </td>
                              <td>2590</td>
                              <td>250</td>
                              <td>
                                <div className="pipeline-progress d-flex align-items-center">
                                  <div className="progress">
                                    <div
                                      className="progress-bar progress-bar-danger"
                                      role="progressbar"
                                    />
                                  </div>
                                  <span>5%</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-pill badge-status bg-success">
                                  Active
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <ul className="lang-type">
                                    <li>
                                      <Link to={route.languageWeb}>Web</Link>
                                    </li>
                                    <li>
                                      <Link to="#">App</Link>
                                    </li>
                                    <li>
                                      <Link to="#">Admin</Link>
                                    </li>
                                  </ul>
                                  <div className="dropdown table-action">
                                    <Link
                                      to="#"
                                      className="action-icon "
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fa fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_translation"
                                      >
                                        <i className="ti ti-edit text-blue" />{" "}
                                        Edit
                                      </Link>
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_translation"
                                      >
                                        <i className="ti ti-trash text-danger" />{" "}
                                        Delete
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr className="even">
                              <td className="sorting_1">
                                <label className="checkboxs">
                                  <input type="checkbox" />
                                  <span className="checkmarks" />
                                </label>
                              </td>
                              <td>
                                <div className="set-star rating-select">
                                  <i className="fa fa-star" />
                                </div>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to="#"
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/flag-04.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to="#"
                                    className="profile-split d-flex flex-column"
                                  >
                                    Hindi
                                  </Link>
                                </h2>
                              </td>
                              <td>hi</td>
                              <td>
                                <div className="status-toggle">
                                  <input
                                    type="checkbox"
                                    id="Hindi"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="Hindi"
                                    className="checktoggle"
                                  >
                                    /label&gt;
                                  </label>
                                </div>
                              </td>
                              <td>1892</td>
                              <td>387</td>
                              <td>
                                <div className="pipeline-progress d-flex align-items-center">
                                  <div className="progress">
                                    <div
                                      className="progress-bar progress-bar-info"
                                      role="progressbar"
                                    />
                                  </div>
                                  <span>40%</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-pill badge-status bg-success">
                                  Active
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <ul className="lang-type">
                                    <li>
                                      <Link to={route.languageWeb}>Web</Link>
                                    </li>
                                    <li>
                                      <Link to="#">App</Link>
                                    </li>
                                    <li>
                                      <Link to="#">Admin</Link>
                                    </li>
                                  </ul>
                                  <div className="dropdown table-action">
                                    <Link
                                      to="#"
                                      className="action-icon "
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fa fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_translation"
                                      >
                                        <i className="ti ti-edit text-blue" />{" "}
                                        Edit
                                      </Link>
                                      <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_translation"
                                      >
                                        <i className="ti ti-trash text-danger" />{" "}
                                        Delete
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <div className="datatable-length" />
                        </div>
                        <div className="col-md-6">
                          <div className="datatable-paginate" />
                        </div>
                      </div>
                      {/* /Contact List */}
                    </div>
                  </div>
                  {/* /Custom Fields */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add Translation */}
      <div
        className="modal custom-modal fade"
        id="add_translation"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Translation</h5>
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
                    Language <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Code <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Status</label>
                  <div className="radio-wrap">
                    <div className="d-flex flex-wrap">
                      <div className="radio-btn">
                        <input
                          type="radio"
                          className="status-radio"
                          id="add-active"
                          name="status"
                          defaultChecked
                        />
                        <label htmlFor="add-active">Active</label>
                      </div>
                      <div className="radio-btn">
                        <input
                          type="radio"
                          className="status-radio"
                          id="add-inactive"
                          name="status"
                        />
                        <label htmlFor="add-inactive">Inactive</label>
                      </div>
                    </div>
                  </div>
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
      {/* /Add Translation */}
      {/* Edit Translation */}
      <div
        className="modal custom-modal fade"
        id="edit_translation"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Translation</h5>
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
                    Language <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="English"
                  />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="en"
                  />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Status</label>
                  <div className="radio-wrap">
                    <div className="d-flex flex-wrap">
                      <div className="radio-btn">
                        <input
                          type="radio"
                          className="status-radio"
                          id="edit-active"
                          name="status"
                          defaultChecked
                        />
                        <label htmlFor="edit-active">Active</label>
                      </div>
                      <div className="radio-btn">
                        <input
                          type="radio"
                          className="status-radio"
                          id="edit-inactive"
                          name="status"
                        />
                        <label htmlFor="edit-inactive">Inactive</label>
                      </div>
                    </div>
                  </div>
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
      {/* /Edit Translation */}
      {/* Import Sample */}
      <div className="modal custom-modal fade" id="import_sample" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Import Sample</h5>
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
                    File <span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>Inventory</option>
                    <option>Expense</option>
                    <option>Product</option>
                  </select>
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Language <span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Chinese</option>
                  </select>
                </div>
                <div className="form-wrap">
                  <div className="drag-attach">
                    <input type="file" />
                    <div className="img-upload">
                      <i className="ti ti-file-broken" />
                      Upload File
                    </div>
                  </div>
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Uploaded Files</label>
                  <div className="upload-file">
                    <h6>Projectneonals teyys.xls</h6>
                    <p>4.25 MB</p>
                    <div className="progress">
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: "25%" }}
                        aria-valuenow={25}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className="black-text">45%</p>
                  </div>
                  <div className="upload-file upload-list">
                    <div>
                      <h6>tes.txt</h6>
                      <p>4.25 MB</p>
                    </div>
                    <Link to="#" className="text-danger">
                      <i className="ti ti-trash-x" />
                    </Link>
                  </div>
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
      {/* /Import Sample */}
      {/* Delete Translation */}
      <div
        className="modal custom-modal fade"
        id="delete_translation"
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
                <div className="success-message text-center">
                  <div className="success-popup-icon">
                    <i className="ti ti-trash-x" />
                  </div>
                  <h3>Remove Translation?</h3>
                  <p className="del-info">
                    Are you sure you want to remove it.
                  </p>
                  <div className="col-lg-12 text-center modal-btn">
                    <Link
                      to="#"
                      className="btn btn-light"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-danger">
                      Yes, Delete it
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Translation */}
    </div>
  );
};

export default Language;
