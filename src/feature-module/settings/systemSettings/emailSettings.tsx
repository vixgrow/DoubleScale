import React from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const EmailSettings = () => {
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
                      <Link to={route.emailSettings} className="active">
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
                      <h4>Other Settings</h4>
                      <ul>
                        <li>
                          <Link to={route.emailSettings} className="active">Email Settings</Link>
                        </li>
                        <li>
                          <Link to={route.smsGateways}>SMS Gateways</Link>
                        </li>
                        <li>
                          <Link to={route.gdprCookies}>GDPR Cookies</Link>
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
                      <h4>Email Settings</h4>
                      <Link to="#" className="btn-add" data-bs-toggle="modal" data-bs-target="#add_mail"><i className="ti ti-mail" /></Link>
                    </div>
                    <div className="row">
                      {/* Email Wrap */}
                      <div className="col-md-12">
                        {/* PHP Mailer */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img">
                                <ImageWithBasePath src="assets/img/icons/mail-01.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <h6>PHP Mailer</h6>
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#php-mail" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light" data-bs-toggle="modal" data-bs-target="#add_phpmail"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail1" className="check" defaultChecked />
                                <label htmlFor="mail1" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="php-mail">
                            <div className="mail-collapse">
                              <p>PHPMailer is a third-party PHP library that provides a simple way to send emails in PHP. It offers a range of features that make it a popular alternative to PHP's built-in mail() function, such as support for HTML emails, attachments, and SMTP authentication.</p>
                            </div>
                          </div>
                        </div>
                        {/* /PHP Mailer */}
                        {/* SMTP */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img">
                                <ImageWithBasePath src="assets/img/icons/mail-02.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <h6>SMTP</h6>
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light" data-bs-toggle="modal" data-bs-target="#add_smtp"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail2" className="check" defaultChecked />
                                <label htmlFor="mail2" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /SMTP */}
                        {/* SendGrid */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img">
                                <ImageWithBasePath src="assets/img/icons/mail-03.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <h6>SendGrid</h6>
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail3" className="check" defaultChecked />
                                <label htmlFor="mail3" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /SendGrid */}
                      </div>
                      {/* /Email Wrap */}
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
    {/* PHP Mailer */}
    <div className="modal custom-modal fade" id="add_phpmail" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">PHP Mailer</h5>
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
                <label className="col-form-label">From Email Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Email Password <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">From Email Name <span className="text-danger">*</span></label>
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
    {/* /PHP Mailer */}
    {/* SMTP */}
    <div className="modal custom-modal fade" id="add_smtp" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">SMTP</h5>
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
                <label className="col-form-label">From Email Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Email Password <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Email Host <span className="text-danger">*</span></label>
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
    {/* /SMTP */}
    {/* Test Mail */}
    <div className="modal custom-modal fade" id="add_mail" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Test Mail</h5>
            <button className="btn-close" data-bs-dismiss="modal" aria-label="Close">	
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-wrap">
                <label className="col-form-label">Enter Email Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="modal-btn">
                <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    {/* /Test Mail */}
  </div>
  )
}

export default EmailSettings