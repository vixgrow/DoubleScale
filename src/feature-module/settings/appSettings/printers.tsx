import React from 'react'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const Printers = () => {
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
                          <Link to={route.printers} className="active">Printer</Link>
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
                {/* Printers */}
                <div className="card">
                  <div className="card-body">
                    <div className="settings-header">
                      <h4>Printer</h4>
                      <Link to="#" className="btn-add" data-bs-toggle="modal" data-bs-target="#add_printer"><i className="ti ti-plus" /></Link>
                    </div>
                    <div className="settings-form">
                      <form>
                        {/* Hp */}
                        <div className="settings-sub-header setting-item">
                          <div>
                            <h6>Hp</h6>
                            <p>Shows the details of Hp printers</p>
                          </div>
                          <div className="dropdown table-action">
                            <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_printer"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_printer"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                            </div>
                          </div>
                        </div>
                        <div className="profile-details">
                          <div className="row">
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Printer Name </label>
                                <input type="text" className="form-control" defaultValue="Hp printer" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Connection Type</label>
                                <input type="text" className="form-control" defaultValue="Network" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">IP Address</label>
                                <input type="text" className="form-control" defaultValue="192.168.0.1" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Port</label>
                                <input type="text" className="form-control" defaultValue={900} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Euro */}
                        {/* Epson */}
                        <div className="settings-sub-header setting-item">
                          <div>
                            <h6>Epson</h6>
                            <p>Shows the details of Epson printers</p>
                          </div>
                          <div className="dropdown table-action">
                            <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_printer"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                              <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_printer"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                            </div>
                          </div>
                        </div>
                        <div className="profile-details border-0 mb-0">
                          <div className="row">
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Printer Name </label>
                                <input type="text" className="form-control" defaultValue="Epson" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Connection Type</label>
                                <input type="text" className="form-control" defaultValue="Network" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">IP Address</label>
                                <input type="text" className="form-control" defaultValue="192.168.0.1" />
                              </div>
                            </div>
                            <div className="col-md-3 col-sm-6">
                              <div className="form-wrap">
                                <label className="col-form-label">Port</label>
                                <input type="text" className="form-control" defaultValue={900} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Epson */}
                        <div className="submit-button">
                          <Link to="#" className="btn btn-light">Cancel</Link>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                {/* /Printers */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* /Page Wrapper */}
    {/* Add Printer */}
    <div className="modal custom-modal fade" id="add_printer" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Printer</h5>
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-wrap">
                <label className="col-form-label">Printer Company <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Printer Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Connection Type <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">IP Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Port <span className="text-danger">*</span></label>
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
    {/* /Add Currency */}
    {/* Edit Printer */}
    <div className="modal custom-modal fade" id="edit_printer" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Printer</h5>
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-wrap">
                <label className="col-form-label">Printer Company <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Hp" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Printer Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Hp printer" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Connection Type <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="Network" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">IP Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue="198.162.0.1" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Port <span className="text-danger">*</span></label>
                <input type="text" className="form-control" defaultValue={900} />
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
    {/* /Edit Printer */}
    {/* Delete Printer */}
    <div className="modal custom-modal fade" id="delete_printer" role="dialog">
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
                <h3>Remove Printer?</h3>
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
    {/* /Delete Printer */}
  </div>
  )
}

export default Printers