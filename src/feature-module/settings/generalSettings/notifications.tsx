import React from 'react'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const Notifications = () => {
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
                      <Link to={route.profile} className="active">
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
                      <h4>General Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.profile}>Profile</Link>
                        </li>
                        <li>
                          <Link to={route.security}>Security</Link>
                        </li>
                        <li>
                          <Link to={route.notification} className="active">Notifications</Link>
                        </li>
                        <li>
                          <Link to={route.connectedApps}>Connected Apps</Link>
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
                      <h4>Security Settings</h4>
                    </div>
                    <div className="settings-form">
                      {/* General Notifications */}	
                      <div className="settings-sub-header">
                        <h6>General Notifications</h6>
                        <p>Select notifications </p>
                      </div>
                      <div className="notification-wrap">
                        <ul>
                          <li>
                            <div className="security-checkbox">
                              <label className="checkboxs">
                                <input type="checkbox" defaultChecked />				
                                <span className="checkmarks" />
                                Mobile Push Notifications
                              </label>
                            </div>
                          </li>
                          <li>
                            <div className="security-checkbox">
                              <label className="checkboxs">
                                <input type="checkbox" defaultChecked />				
                                <span className="checkmarks" />
                                Desktop Notifications
                              </label>
                            </div>
                          </li>
                          <li>
                            <div className="security-checkbox">
                              <label className="checkboxs">
                                <input type="checkbox" defaultChecked />				
                                <span className="checkmarks" />
                                Email Notifications
                              </label>
                            </div>
                          </li>
                          <li>
                            <div className="security-checkbox">
                              <label className="checkboxs">
                                <input type="checkbox" defaultChecked />				
                                <span className="checkmarks" />
                                SMS Notifications
                              </label>
                            </div>
                          </li>
                        </ul>
                      </div>
                      {/* /General Notifications */}		
                      {/* Custom Notifications */}									
                      <div className="settings-sub-header">
                        <h6>Custom Notifications</h6>
                        <p>Select when you will be notified when the following changes occur </p>
                      </div>
                      <div className="table-responsive notificaion-table">
                        <table className="table table-borderless">
                          <thead>
                            <tr>
                              <th />
                              <th>Push</th>
                              <th>SMS</th>
                              <th>Email</th>
                            </tr>
                          </thead>
                          <tbody className="custom-table-data">
                            <tr>
                              <td>
                                Legendary
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="users4" className="check" defaultChecked />
                                  <label htmlFor="users4" className="checktoggle">	</label>
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="users5" className="check" defaultChecked />
                                  <label htmlFor="users5" className="checktoggle">	</label>
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="users6" className="check" defaultChecked />
                                  <label htmlFor="users6" className="checktoggle">	</label>
                                </div>
                              </td>
                            </tr>	
                            <tr>
                              <td>
                                Transaction
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user5" className="check" defaultChecked />
                                  <label htmlFor="user5" className="checktoggle">	</label>
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user6" className="check" defaultChecked />
                                  <label htmlFor="user6" className="checktoggle">	</label>
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user7" className="check" defaultChecked />
                                  <label htmlFor="user7" className="checktoggle">	</label>
                                </div>
                              </td>
                            </tr>												
                            <tr>
                              <td>
                                Email Verification
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user8" className="check" defaultChecked />
                                  <label htmlFor="user8" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user9" className="check" defaultChecked />
                                  <label htmlFor="user9" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user10" className="check" defaultChecked />
                                  <label htmlFor="user10" className="checktoggle" />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                OTP
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user11" className="check" defaultChecked />
                                  <label htmlFor="user11" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user12" className="check" defaultChecked />
                                  <label htmlFor="user12" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user13" className="check" defaultChecked />
                                  <label htmlFor="user13" className="checktoggle" />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Activity
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user14" className="check" defaultChecked />
                                  <label htmlFor="user14" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user15" className="check" defaultChecked />
                                  <label htmlFor="user15" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user16" className="check" defaultChecked />
                                  <label htmlFor="user16" className="checktoggle" />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Account
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user17" className="check" defaultChecked />
                                  <label htmlFor="user17" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user18" className="check" defaultChecked />
                                  <label htmlFor="user18" className="checktoggle" />
                                </div>
                              </td>
                              <td>
                                <div className="status-toggle modal-status">
                                  <input type="checkbox" id="user19" className="check" defaultChecked />
                                  <label htmlFor="user19" className="checktoggle" />
                                </div>
                              </td>
                            </tr>										
                          </tbody>
                        </table>
                      </div>
                      {/* /Custom Notifications */}
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
    {/* Delete Account */}
    <div className="modal custom-modal fade" id="delete_account" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 m-0 justify-content-end">
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <div className="success-message text-center">
              <div className="success-popup-icon">
                <i className="ti ti-trash-x" />
              </div>
              <h3>Delete Account</h3>
              <p className="del-info">Are you sure want to delete?</p>
              <div className="col-lg-12 text-center modal-btn">
                <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
                <Link to={route.security} className="btn btn-danger">Yes, Delete it</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* /Delete Account */}
  </div>
  )
}

export default Notifications