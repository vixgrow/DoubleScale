import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../router/all_routes';
import CollapseHeader from '../../core/common/collapse-header';

const route = all_routes;

const MembershipAddon = () => {
  
  return (
    <div className="page-wrapper">
    <div className="content">
      <div className="row">
        <div className="col-md-12">
          {/* Page Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col-8">
                <h4 className="page-title">Membership Addons</h4>
              </div>
              <div className="col-4 text-end">
                <div className="head-icons">
                  <CollapseHeader />
                </div>
              </div>
            </div>
          </div>
          {/* /Page Header */}
          <div className="card main-card">
            <div className="card-body">
              {/* Membership Addons */}
              <form>
                <div className="row">
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Addon Name <span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <h5 className="mb-3">Addon Settings</h5>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Contacts <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-1"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-1" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Compaigns <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-4"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-4" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Leads <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-2"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-2" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Tasks <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-7"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-7" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Companies <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-3"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-3" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Pipelines <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-8"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-8" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Projects <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-5"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-5" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Deals <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-6"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-6" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Activities <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="0-100"
                        />
                        <div className="status-toggle ms-3">
                          <input
                            id="mem-tog-9"
                            className="check"
                            type="checkbox"
                          />
                          <label htmlFor="mem-tog-9" className="checktoggle">
                            checkbox
                          </label>
                        </div>
                      </div>
                      <label className="checkboxs mt-2">
                        <input type="checkbox" />
                        <span className="checkmarks mem-plane-check" />
                        Unlimited
                      </label>
                    </div>
                  </div>
                </div>
                <div className="submit-button text-end">
                  <Link to="#" className="btn btn-light sidebar-close">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                </div>
              </form>
              {/* /Membership Addons */}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  )
}

export default MembershipAddon
