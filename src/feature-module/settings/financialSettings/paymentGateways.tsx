import React from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from "react-router-dom";
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;
const PaymentGateways = () => {
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
                          <Link to={route.paymentGateways} className="active">Payment Gateways</Link>
                        </li>
                        <li>
                          <Link to={route.bankAccounts}>Bank Accounts</Link>
                        </li>
                        <li>
                          <Link to={route.taxRates}>Tax Rates</Link>
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
                      <h4>Payment Gateways</h4>
                    </div>
                    <div className="row">
                      {/* Email Wrap */}
                      <div className="col-md-12">
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-01.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#php-mail" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light" data-bs-toggle="modal" data-bs-target="#add_paypal"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail1" className="check" defaultChecked />
                                <label htmlFor="mail1" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="php-mail">
                            <div className="mail-collapse">
                              <p>PayPal Holdings, Inc. is an American multinational financial technology company operating an online payments system in the majority of countries that support online money transfers, and serves as an electronic alternative to traditional paper methods such as checks and money orders. </p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-02.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse1" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail2" className="check" defaultChecked />
                                <label htmlFor="mail2" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse1">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-03.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse2" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail3" className="check" defaultChecked />
                                <label htmlFor="mail3" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse2">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-04.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse3" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail4" className="check" />
                                <label htmlFor="mail4" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse3">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-05.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse4" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail5" className="check" defaultChecked />
                                <label htmlFor="mail5" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse4">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-06.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse5" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail6" className="check" />
                                <label htmlFor="mail6" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse5">
                            <div className="mail-collapse">
                              <p>Lorem Holdings, Inc. is an American multinational financial technology company operating an online payments system in the majority of countries that support online money transfers, and serves as an electronic alternative to traditional paper methods such as checks and money orders. </p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-07.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse6" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail7" className="check" defaultChecked />
                                <label htmlFor="mail7" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse6">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-08.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse7" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail8" className="check" defaultChecked />
                                <label htmlFor="mail8" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse7">
                            <div className="mail-collapse">
                              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla dapibus magna sit amet risus dictum iaculis. Donec fermentum fermentum tincidunt. Pellentesque mauris elit, viverra non eros in, condimentum vulputate libero. Phasellus eu orci et felis maximus posuere.</p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-09.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#" className="connected">Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse8" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-light"><i className="ti ti-tool" />View Integration</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail9" className="check" />
                                <label htmlFor="mail9" className="checktoggle">	</label>
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse8">
                            <div className="mail-collapse">
                              <p>PayPal Holdings, Inc. is an American multinational financial technology company operating an online payments system in the majority of countries that support online money transfers, and serves as an electronic alternative to traditional paper methods such as checks and money orders. </p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
                        {/* Payment */}
                        <div className="mail-wrapper">
                          <div className="mail-wrap">
                            <div className="mail-item">
                              <span className="mail-img lg-img">
                                <ImageWithBasePath src="assets/img/icons/payment-10.svg" alt="" />
                              </span>
                              <div className="mail-info">
                                <Link to="#">Not Connected</Link>
                              </div>
                            </div>
                            <div className="email-action">
                              <div>
                                <Link to="#" data-bs-toggle="collapse" data-bs-target="#collapse9" className="info-icon"><i className="ti ti-info-circle-filled" /></Link>
                                <Link to="#" className="btn btn-primary"><i className="ti ti-plug-connected" />Connect Now</Link>
                              </div>
                              <div className="status-toggle">
                                <input type="checkbox" id="mail10" className="check" defaultChecked />
                                <label htmlFor="mail10" className="checktoggle" />
                              </div>
                            </div>
                          </div>
                          <div className="collapse" id="collapse9">
                            <div className="mail-collapse">
                              <p>PayPal Holdings, Inc. is an American multinational financial technology company operating an online payments system in the majority of countries that support online money transfers, and serves as an electronic alternative to traditional paper methods such as checks and money orders. </p>
                            </div>
                          </div>
                        </div>
                        {/* /Payment */}
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
    {/* Paypal */}
    <div className="modal custom-modal fade" id="add_paypal" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Paypal</h5>
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
                <label className="col-form-label">API Key <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Secret Key <span className="text-danger">*</span></label>
                <input type="text" className="form-control" />
              </div>
              <div className="form-wrap">
                <label className="col-form-label">Status</label>
                <div className="radio-btn-items">
                  <div className="radio-btn">
                    <input type="radio" className="status-radio" id="pdf" name="export-type" defaultChecked />
                    <label htmlFor="pdf">Active</label>
                  </div>
                  <div className="radio-btn">
                    <input type="radio" className="status-radio" id="share" name="export-type" />
                    <label htmlFor="share">Inactive</label>
                  </div>
                </div>
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
    {/* /Paypal */}
  </div>
  )
}

export default PaymentGateways