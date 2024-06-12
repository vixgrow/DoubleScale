import React from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const Storage = () => {
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
                          <Link to={route.storage} className="active">Storage</Link>
                        </li>
                        <li>
                          <Link to={route.banIpAddrress}>Ban IP Address</Link>
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
                      <h4>Storage</h4>
                    </div>
                    <div className="row">
                      {/* Storage */}
                      <div className="col-xxl-4 col-sm-6">
                        <div className="storage-wrap">
                          <div className="storage-icon">
                            <span className="system-app-icon">
                              <ImageWithBasePath src="assets/img/icons/storage-icon-01.svg" alt="" />
                            </span>
                            <h6>Local Storage</h6>
                          </div>
                          <div className="setting-gateway">
                            <Link to="#"><i className="ti ti-settings" /></Link>
                            <div className="status-toggle">
                              <input type="checkbox" id="loc" className="check" defaultChecked />
                              <label htmlFor="loc" className="checktoggle">	</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Storage */}
                      {/* Storage */}
                      <div className="col-xxl-4 col-sm-6">
                        <div className="storage-wrap">
                          <div className="storage-icon">
                            <span className="system-app-icon">
                              <ImageWithBasePath src="assets/img/icons/storage-icon-02.svg" alt="" />
                            </span>
                            <h6>AWS</h6>
                          </div>
                          <div className="setting-gateway">
                            <Link to="#" data-bs-toggle="modal" data-bs-target="#add_settings"><i className="ti ti-settings" /></Link>
                            <div className="status-toggle">
                              <input type="checkbox" id="aws" className="check" defaultChecked />
                              <label htmlFor="aws" className="checktoggle" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Storage */}
                    </div>
                    <div className="submit-button">
                      <Link to="#" className="btn btn-light">Cancel</Link>
                      <button type="submit" className="btn btn-primary">Save Changes</button>
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
    {/* AWS Settings */}
    <div className="modal custom-modal fade" id="add_settings" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">AWS Settings</h5>
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
                <label className="col-form-label">AWS Access Key <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Secret Key <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Bucket Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Region <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Base URL <span className="text-danger">*</span></label>
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
    {/* /AWS Settings */}
  </div>
  )
}

export default Storage