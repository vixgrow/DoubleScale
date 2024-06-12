import React from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';

const ConnectedApps = () => {
  const route = all_routes;
  return (
    <>
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
                        <Link to={route.notification}>Notifications</Link>
                      </li>
                      <li>
                        <Link to={route.connectedApps} className="active">
                          Connected Apps
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
                <div className="card-body pb-0">
                  <div className="settings-header">
                    <h4>Connected Apps</h4>
                  </div>
                  <div className="row">
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-01.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#" className="connected">
                              Connected
                            </Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Google Calendar</p>
                          <div className="status-toggle">
                            <input
                              id="google_calendar"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label
                              htmlFor="google_calendar"
                              className="checktoggle"
                            >
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-02.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#">Connect</Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Figma</p>
                          <div className="status-toggle">
                            <input
                              id="figma"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label htmlFor="figma" className="checktoggle">
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-03.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#" className="connected">
                              Connected
                            </Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Dropbox</p>
                          <div className="status-toggle">
                            <input
                              id="dropbox"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label htmlFor="dropbox" className="checktoggle">
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-04.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#">Connect</Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Slack</p>
                          <div className="status-toggle">
                            <input
                              id="slack"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label htmlFor="slack" className="checktoggle">
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-05.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#" className="connected">
                              Connected
                            </Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Gmail</p>
                          <div className="status-toggle">
                            <input
                              id="gmail"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label htmlFor="gmail" className="checktoggle">
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
                    {/* App */}
                    <div className="col-md-4 col-sm-6">
                      <div className="integration-grid">
                        <div className="integration-calendar">
                          <ImageWithBasePath
                            src="assets/img/icons/integration-06.svg"
                            alt="Icon"
                          />
                          <div className="connect-btn">
                            <Link to="#">Connect</Link>
                          </div>
                        </div>
                        <div className="integration-content">
                          <p>Github</p>
                          <div className="status-toggle">
                            <input
                              id="github"
                              className="check"
                              type="checkbox"
                              defaultChecked={true}
                            />
                            <label htmlFor="github" className="checktoggle">
                              checkbox
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /App */}
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
</>

  )
}

export default ConnectedApps
