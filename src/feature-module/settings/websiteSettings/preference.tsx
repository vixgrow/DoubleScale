import React from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const Preference = () => {
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
                            <Link to={route.preference} className="active">Preference</Link>
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
                        <h4>Preference</h4>
                      </div>	
                      <form>							
                        <div className="row">
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-01.svg" alt="" />
                                <h6>Contact</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer1" className="check" defaultChecked />
                                  <label htmlFor="prefer1" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-02.svg" alt="" />
                                <h6>Deals</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer2" className="check" defaultChecked />
                                  <label htmlFor="prefer2" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-03.svg" alt="" />
                                <h6>Leads</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer3" className="check" defaultChecked />
                                  <label htmlFor="prefer3" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-04.svg" alt="" />
                                <h6>Pipelines</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer4" className="check" defaultChecked />
                                  <label htmlFor="prefer4" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-05.svg" alt="" />
                                <h6>Campaign</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer5" className="check" defaultChecked />
                                  <label htmlFor="prefer5" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-06.svg" alt="" />
                                <h6>Projects</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer6" className="check" defaultChecked />
                                  <label htmlFor="prefer6" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-07.svg" alt="" />
                                <h6>Tasks</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer7" className="check" defaultChecked />
                                  <label htmlFor="prefer7" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-08.svg" alt="" />
                                <h6>Acivities</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer9" className="check" defaultChecked />
                                  <label htmlFor="prefer9" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-09.svg" alt="" />
                                <h6>Company</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer10" className="check" defaultChecked />
                                  <label htmlFor="prefer10" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-10.svg" alt="" />
                                <h6>Analytics</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer11" className="check" defaultChecked />
                                  <label htmlFor="prefer11" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-11.svg" alt="" />
                                <h6>Clients</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer12" className="check" defaultChecked />
                                  <label htmlFor="prefer12" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-sm-6">
                            <div className="storage-wrap prefer-wrap">
                              <div className="storage-icon">
                                <ImageWithBasePath src="assets/img/icons/preference-12.svg" alt="" />
                                <h6>Customers</h6>
                              </div>
                              <div className="setting-gateway">
                                <div className="status-toggle">
                                  <input type="checkbox" id="prefer13" className="check" defaultChecked />
                                  <label htmlFor="prefer13" className="checktoggle">	</label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="submit-button">
                          <Link to="#" className="btn btn-light">Cancel</Link>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
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
  )
}

export default Preference