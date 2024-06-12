import React from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
const route = all_routes;
const BanIpAddress = () => {
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
                        <Link to={route.storage} className="active">
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
                            <Link to={route.storage}>Storage</Link>
                          </li>
                          <li>
                            <Link to={route.banIpAddrress} className="active">
                              Ban IP Address
                            </Link>
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
                        <h4>Ban IP Address</h4>
                        <Link
                          to="#"
                          className="btn-add"
                          data-bs-toggle="modal"
                          data-bs-target="#add_ip"
                        >
                          <i className="ti ti-plus" />
                        </Link>
                      </div>
                      <div className="row">
                        {/* Ban Ip Box */}
                        <div className="col-xxl-4 col-sm-6">
                          <div className="ip-wrap">
                            <div className="ip-icon">
                              <Link
                                to="#"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-original-title="Temporarily block to protect user accounts from internet fraudsters."
                              >
                                <i className="ti ti-info-circle-filled" />
                              </Link>
                              <h6>198.120.16.01</h6>
                            </div>
                            <div className="dropdown table-action">
                              <Link
                                to="#"
                                className="action-icon"
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
                                  data-bs-target="#edit_ip"
                                >
                                  <i className="fa-solid fa-pencil text-blue" />{" "}
                                  Edit
                                </Link>
                                <Link
                                  className="dropdown-item"
                                  to="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_ip"
                                >
                                  <i className="fa-regular fa-trash-can text-danger" />{" "}
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Ban Ip Box */}
                        {/* Ban Ip Box */}
                        <div className="col-xxl-4 col-sm-6">
                          <div className="ip-wrap">
                            <div className="ip-icon">
                              <Link
                                to="#"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-original-title="Temporarily block to protect user accounts from internet fraudsters."
                              >
                                <i className="ti ti-info-circle-filled" />
                              </Link>
                              <h6>198.120.23.56</h6>
                            </div>
                            <div className="dropdown table-action">
                              <Link
                                to="#"
                                className="action-icon"
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
                                  data-bs-target="#edit_ip"
                                >
                                  <i className="fa-solid fa-pencil text-blue" />{" "}
                                  Edit
                                </Link>
                                <Link
                                  className="dropdown-item"
                                  to="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_ip"
                                >
                                  <i className="fa-regular fa-trash-can text-danger" />{" "}
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Ban Ip Box */}
                        {/* Ban Ip Box */}
                        <div className="col-xxl-4 col-sm-6">
                          <div className="ip-wrap">
                            <div className="ip-icon">
                              <Link
                                to="#"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-original-title="Temporarily block to protect user accounts from internet fraudsters."
                              >
                                <i className="ti ti-info-circle-filled" />
                              </Link>
                              <h6>198.132.57.12</h6>
                            </div>
                            <div className="dropdown table-action">
                              <Link
                                to="#"
                                className="action-icon"
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
                                  data-bs-target="#edit_ip"
                                >
                                  <i className="fa-solid fa-pencil text-blue" />{" "}
                                  Edit
                                </Link>
                                <Link
                                  className="dropdown-item"
                                  to="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_ip"
                                >
                                  <i className="fa-regular fa-trash-can text-danger" />{" "}
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Ban Ip Box */}
                        {/* Ban Ip Box */}
                        <div className="col-xxl-4 col-sm-6">
                          <div className="ip-wrap">
                            <div className="ip-icon">
                              <Link
                                to="#"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-original-title="Temporarily block to protect user accounts from internet fraudsters."
                              >
                                <i className="ti ti-info-circle-filled" />
                              </Link>
                              <h6>198.120.32.01</h6>
                            </div>
                            <div className="dropdown table-action">
                              <Link
                                to="#"
                                className="action-icon"
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
                                  data-bs-target="#edit_ip"
                                >
                                  <i className="fa-solid fa-pencil text-blue" />{" "}
                                  Edit
                                </Link>
                                <Link
                                  className="dropdown-item"
                                  to="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_ip"
                                >
                                  <i className="fa-regular fa-trash-can text-danger" />{" "}
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Ban Ip Box */}
                        {/* Ban Ip Box */}
                        <div className="col-xxl-4 col-sm-6">
                          <div className="ip-wrap">
                            <div className="ip-icon">
                              <Link
                                to="#"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-original-title="Temporarily block to protect user accounts from internet fraudsters."
                              >
                                <i className="ti ti-info-circle-filled" />
                              </Link>
                              <h6>198.120.32.25</h6>
                            </div>
                            <div className="dropdown table-action">
                              <Link
                                to="#"
                                className="action-icon"
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
                                  data-bs-target="#edit_ip"
                                >
                                  <i className="fa-solid fa-pencil text-blue" />{" "}
                                  Edit
                                </Link>
                                <Link
                                  className="dropdown-item"
                                  to="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_ip"
                                >
                                  <i className="fa-regular fa-trash-can text-danger" />{" "}
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Ban Ip Box */}
                      </div>
                      <div className="submit-button">
                        <Link to="#" className="btn btn-light">
                          Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
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
      {/* Add Ban IP Address */}
      <div className="modal custom-modal fade" id="add_ip" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Ban IP Address</h5>
              <div className="d-flex align-items-center mod-toggle">
                <div className="status-toggle">
                  <input
                    type="checkbox"
                    id="toggle"
                    className="check"
                    defaultChecked
                  />
                  <label htmlFor="toggle" className="checktoggle" />
                </div>
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <form >
                <div className="form-wrap">
                  <label className="col-form-label">
                    IP Address <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Reason For Ban</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    defaultValue={""}
                  />
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
      {/* /Add Ban IP Address */}
      {/* Edit Ban IP Address */}
      <div className="modal custom-modal fade" id="edit_ip" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Ban IP Address</h5>
              <div className="d-flex align-items-center mod-toggle">
                <div className="status-toggle">
                  <input
                    type="checkbox"
                    id="toggle1"
                    className="check"
                    defaultChecked
                  />
                  <label htmlFor="toggle1" className="checktoggle" />
                </div>
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <form >
                <div className="form-wrap">
                  <label className="col-form-label">
                    IP Address <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Reason For Ban</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    defaultValue={""}
                  />
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
      {/* /Edit Ban IP Address */}
      {/* Delete IP Address */}
      <div className="modal custom-modal fade" id="delete_ip" role="dialog">
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
              <form >
                <div className="success-message text-center">
                  <div className="success-popup-icon">
                    <i className="ti ti-trash-x" />
                  </div>
                  <h3>Remove IP Address?</h3>
                  <p>Are you sure you want to remove it.</p>
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
      {/* /Delete IP Address */}
    </div>
  );
};

export default BanIpAddress;
