import React from 'react'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const TaxRates = () => {
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
                              <Link to={route.paymentGateways}>Payment Gateways</Link>
                            </li>
                            <li>
                              <Link to={route.bankAccounts}>Bank Accounts</Link>
                            </li>
                            <li>
                              <Link to={route.taxRates} className="active">Tax Rates</Link>
                            </li>
                            <li>
                              <Link to={route.currencies}>Currencies</Link>
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
                      <div className="card-body pb-0">
                        <div className="settings-header">
                          <h4>Tax Rates</h4>
                          <Link to="#" className="btn-add" data-bs-toggle="modal" data-bs-target="#add_tax"><i className="ti ti-plus" /></Link>
                        </div>
                        <div className="row">
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">VAT</label>
                              <div className="icon-form-end">
                                <Link to="#" data-bs-toggle="modal" data-bs-target="#edit_tax">
                                  <span className="form-icon"><i className="ti ti-edit" /></span>
                                </Link>
                                <input type="text" className="form-control" defaultValue="16%" />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">GST</label>
                              <div className="icon-form-end">
                                <Link to="#" data-bs-toggle="modal" data-bs-target="#edit_tax">
                                  <span className="form-icon"><i className="ti ti-edit" /></span>
                                </Link>
                                <input type="text" className="form-control" defaultValue="14%" />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap">
                              <label className="col-form-label">HST</label>
                              <div className="icon-form-end">
                                <Link to="#" data-bs-toggle="modal" data-bs-target="#edit_tax">
                                  <span className="form-icon"><i className="ti ti-edit" /></span>
                                </Link>
                                <input type="text" className="form-control" defaultValue="12%" />
                              </div>
                            </div>
                          </div>											
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
        {/* Add Tax Rate */}
        <div className="modal custom-modal fade" id="add_tax" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Tax Rate</h5>
                <div className="d-flex align-items-center mod-toggle">
                  <div className="status-toggle">
                    <input type="checkbox" id="toggle" className="check" defaultChecked />
                    <label htmlFor="toggle" className="checktoggle" />
                  </div>
                  <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
                    <i className="ti ti-x" />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-wrap">
                    <label className="col-form-label">Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="form-wrap">
                    <label className="col-form-label">Tax Rate % <span className="text-danger">*</span></label>
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
        {/* /Add Tax Rate */}
        {/* Edit Tax Rate */}
        <div className="modal custom-modal fade" id="edit_tax" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Tax Rate</h5>
                <div className="d-flex align-items-center mod-toggle">
                  <div className="status-toggle">
                    <input type="checkbox" id="toggle1" className="check" defaultChecked />
                    <label htmlFor="toggle1" className="checktoggle" />
                  </div>
                  <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
                    <i className="ti ti-x" />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-wrap">
                    <label className="col-form-label">Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" defaultValue="VAT" />
                  </div>
                  <div className="form-wrap">
                    <label className="col-form-label">Tax Rate % <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" defaultValue={16} />
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
        {/* /Edit Tax Rate */}
      </div>
  )
}

export default TaxRates