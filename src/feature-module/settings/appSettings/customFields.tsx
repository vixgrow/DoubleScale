import React from 'react'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const CustomFields = () => {
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
                          <Link to={route.invoiceSettings}>Invoice Settings</Link>
                        </li>
                        <li>
                          <Link to={route.printers}>Printer</Link>
                        </li>
                        <li>
                          <Link to={route.customFields} className="active">Custom Fields</Link>
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
                      <h4>Custom Fields</h4>
                      <Link to="#" className="btn-add" data-bs-toggle="modal" data-bs-target="#add_fields"><i className="ti ti-plus" /></Link>
                    </div>
                    <div className="settings-form">
                      <form>
                        {/* Expense */}
                        <div className="settings-sub-header setting-item">
                          <div>
                            <h6>Expense</h6>
                            <p>Shows the fields of Expense</p>
                          </div>
                          <div className="dropdown table-action">
                            <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_fields"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_fields"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                            </div>
                          </div>
                        </div>
                        <div className="profile-details">
                          <div className="row">
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Label</label>
                                <input type="text" className="form-control" defaultValue="Name" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Type</label>
                                <input type="text" className="form-control" defaultValue="Text" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Default Value</label>
                                <input type="text" className="form-control" defaultValue="Name" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Required</label>
                                <input type="text" className="form-control" defaultValue="Required" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Status</label>
                                <input type="text" className="form-control" defaultValue="Active" />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Expense */}
                        {/* Transaction */}
                        <div className="settings-sub-header setting-item">
                          <div>
                            <h6>Transaction</h6>
                            <p>Shows the fields of Transaction</p>
                          </div>
                          <div className="dropdown table-action">
                            <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_fields"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_fields"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                            </div>
                          </div>
                        </div>
                        <div className="profile-details border-0 mb-0">
                          <div className="row">
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Label</label>
                                <input type="text" className="form-control" defaultValue="Comment" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Type</label>
                                <input type="text" className="form-control" defaultValue="Textarea" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Default Value</label>
                                <input type="text" className="form-control" defaultValue="Enter Comments" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Required</label>
                                <input type="text" className="form-control" defaultValue="Required" />
                              </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Status</label>
                                <input type="text" className="form-control" defaultValue="Active" />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Transaction */}
                        <div className="submit-button">
                          <Link to="#" className="btn btn-light">Cancel</Link>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                      </form>
                    </div>
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
    {/* Add Custom Fields */}
    <div className="modal custom-modal fade" id="add_fields" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Custom Fields</h5>
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-wrap">
                <label className="col-form-label">Custom Fields For <span className="text-danger">*</span></label>
                <select className="select">
                  <option>Choose</option>
                  <option>Expense</option>
                  <option>Transaction</option>
                </select>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Label <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Type <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Default Value</label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Required <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Status <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="modal-btn">
                <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    {/* /Add Custom Fields */}
    {/* Edit Custom Fields */}
    <div className="modal custom-modal fade" id="edit_fields" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Custom Fields</h5>
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-wrap">
                <label className="col-form-label">Custom Fields For <span className="text-danger">*</span></label>
                <select className="select">
                  <option>Choose</option>
                  <option selected>Expense</option>
                  <option>Transaction</option>
                </select>
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Label <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Name" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Type <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Text" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Default Value</label>
                <input type="text" className="form-control" defaultValue="Name" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Required <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Required" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Status <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Active" />
              </div>
              <div className="modal-btn">
                <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    {/* /Edit Custom Fields */}
    {/* Delete Fields */}
    <div className="modal custom-modal fade" id="delete_fields" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 m-0 justify-content-end">
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="success-message text-center">
                <div className="success-popup-icon">
                  <i className="ti ti-trash-x" />
                </div>
                <h3>Remove Field?</h3>
                <p className="del-info">Are you sure you want to remove it.</p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
                  <button type="submit" className="btn btn-danger">Yes, Delete it</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    {/* /Delete Fields */}
  </div>
  )
}

export default CustomFields