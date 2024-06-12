import React from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header";

const Prefixes = () => {
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
                            <Link to={route.prefixes} className="active">
                              Prefixes
                            </Link>
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
                  {/* Prefixes */}
                  <div className="card">
                    <div className="card-body">
                      <div className="settings-header">
                        <h4>Prefixes</h4>
                      </div>
                      <form>
                        <div className="row">
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Products(SKU)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SKU - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Supplier</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SUP - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Purchase</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="PU - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Purchase Return
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="PR - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Sales</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SA - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Sales Return
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SR -  "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Customer</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="CT - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Expense</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="EX - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Stock Transfer
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="ST -  "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Stock Adjustment
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SA -  "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Sales Order
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="SO - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Invoice</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="INV -  "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Estimation
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="EST - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Transaction
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="TRN - "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Employee</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="EMP -  "
                              />
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Purchase Return
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="PR -  "
                              />
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

export default Prefixes;
