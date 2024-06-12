import React from 'react'
import BankAccountsModal from '../../../core/modals/bank_accounts'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';

const BankAccounts = () => {
  const route = all_routes;
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
                      <Link to={route.bankAccounts} className="active">Bank Accounts</Link>
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
                  <h4>Bank Accounts</h4>
                  <Link to="javascript:void(0)" className="btn-add" data-bs-toggle="modal" data-bs-target="#add_bank"><i className="ti ti-plus" /></Link>
                </div>
                <div className="row">
                  {/* Bank Account */}
                  <div className="col-xxl-4 col-sm-6">
                    <div className="bank-box active">
                      <div className="bank-header">
                        <div className="bank-name">
                          <h6>HDFC</h6>
                          <p>**** **** 4872</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bank-info">
                          <h6>Holder Name</h6>
                          <p>Darlee Robertson</p>
                        </div>
                        <div className="dropdown table-action">
                          <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_bank"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_bank"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>	
                  {/* /Bank Account */}
                  {/* Bank Account */}
                  <div className="col-xxl-4 col-sm-6">
                    <div className="bank-box">
                      <div className="bank-header">
                        <div className="bank-name">
                          <h6>SBI</h6>
                          <p>**** **** 2495</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bank-info">
                          <h6>Holder Name</h6>
                          <p>Sharon Roy</p>
                        </div>
                        <div className="dropdown table-action">
                          <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_bank"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_bank"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>	
                  {/* /Bank Account */}
                  {/* Bank Account */}
                  <div className="col-xxl-4 col-sm-6">
                    <div className="bank-box">
                      <div className="bank-header">
                        <div className="bank-name">
                          <h6>KVB</h6>
                          <p>**** **** 3948</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bank-info">
                          <h6>Holder Name</h6>
                          <p>Vaughan</p>
                        </div>
                        <div className="dropdown table-action">
                          <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" /></Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#edit_bank"><i className="fa-solid fa-pencil text-blue" /> Edit</Link>
                            <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_bank"><i className="fa-regular fa-trash-can text-danger" /> Delete</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>	
                  {/* /Bank Account */}
                </div>
              </div>
            </div>
            {/* /Settings Info */}
          </div>
        </div>
      </div>
    </div>
  </div>

  <BankAccountsModal />

</div>


  )
}

export default BankAccounts