import React from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CurrenciesModal from "../../../core/modals/currenciesModal";
import CollapseHeader from "../../../core/common/collapse-header";

const Currencies = () => {
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
                      <Link to={route.paymentGateways} className="active">
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
                      <h4>Financial Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.paymentGateways}>
                            Payment Gateways
                          </Link>
                        </li>
                        <li>
                          <Link to={route.bankAccounts}>Bank Accounts</Link>
                        </li>
                        <li>
                          <Link to={route.taxRates}>Tax Rates</Link>
                        </li>
                        <li>
                          <Link to={route.currencies} className="active">
                            Currencies
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* /Settings Sidebar */}
              </div>
              <div className="col-xl-9 col-lg-12">
                {/* Currencies */}
                <div className="card">
                  <div className="card-body">
                    <div className="settings-header">
                      <h4>Currencies</h4>
                      <Link
                        to="javascript:void(0)"
                        className="btn-add"
                        data-bs-toggle="modal"
                        data-bs-target="#add_currency"
                      >
                        <i className="ti ti-plus" />
                      </Link>
                    </div>
                    <form>
                      {/* Euro */}
                      <div className="settings-sub-header setting-item">
                        <div>
                          <h6>Euro</h6>
                          <p>Shows the details of Euro currency</p>
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
                              data-bs-target="#edit_currency"
                            >
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_currency"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Euro"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Code</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="EUR"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Symbol</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="€"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Exchange Rate
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Default"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Euro */}
                      {/* England Pound */}
                      <div className="settings-sub-header setting-item">
                        <div>
                          <h6>England Pound</h6>
                          <p>Shows the details of England Pound currency</p>
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
                              data-bs-target="#edit_currency"
                            >
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_currency"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="England Pound"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Code</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="GBP"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Symbol</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="€"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Exchange Rate
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Default"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /England Pound */}
                      {/* Indian Rupee */}
                      <div className="settings-sub-header setting-item">
                        <div>
                          <h6>Indian Rupee</h6>
                          <p>Shows the details of Indian Rupee currency</p>
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
                              data-bs-target="#edit_currency"
                            >
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_currency"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="profile-details">
                        <div className="row">
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Indian Rupee"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Code</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="INR"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Symbol</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="₹"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Exchange Rate
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="83.11"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Indian Rupee */}
                      {/* US Dollar */}
                      <div className="settings-sub-header setting-item">
                        <div>
                          <h6>US Dollar</h6>
                          <p>Shows the details of US Dollar currency</p>
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
                              data-bs-target="#edit_currency"
                            >
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_currency"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="profile-details border-0 mb-0">
                        <div className="row">
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="US Dollar"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Code</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="USD"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Symbol</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="$"
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Exchange Rate
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Default"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /US Dollar */}
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
                {/* /Currencies */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CurrenciesModal />
    </div>
  );
};

export default Currencies;
