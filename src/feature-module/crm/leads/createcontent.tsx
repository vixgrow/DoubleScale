import React from 'react'
import { Link } from 'react-router-dom'
import Select from 'react-select'

const ContentAccount = () => {

    const options = [
        { value: 'Gmail', label: 'Gmail' },
        { value: 'Outlook', label: 'Outlook' },
        { value: 'Imap', label: 'Imap' },
      
      ];

    return (
        <>
        {/* Connect Account */}
        <div className="modal custom-modal fade" id="create_email" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Connect Account</h5>
                <button
                  type="button"
                  className="btn-close position-static"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body p-0">
                <div className="form-wrap">
                  <label className="col-form-label">
                    Account type <span className="text-danger"> *</span>
                  </label>
                  <Select className="select" options={options} />
              
                </div>
                <div className="form-wrap">
                  <h5 className="form-title">Sync emails from</h5>
                  <div className="sync-radio">
                    <div className="radio-item">
                      <input
                        type="radio"
                        className="status-radio"
                        id="test1"
                        name="radio-group"
                        defaultChecked
                      />
                      <label htmlFor="test1">Now</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        className="status-radio"
                        id="test2"
                        name="radio-group"
                      />
                      <label htmlFor="test2">1 Month Ago</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        className="status-radio"
                        id="test3"
                        name="radio-group"
                      />
                      <label htmlFor="test3">3 Month Ago</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        className="status-radio"
                        id="test4"
                        name="radio-group"
                      />
                      <label htmlFor="test4">6 Month Ago</label>
                    </div>
                  </div>
                </div>
                <div className="col-lg-12 text-end modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button
                    className="btn btn-primary"
                    data-bs-target="#success_mail"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                  >
                    Connect Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Connect Account */}
      </>
      
    )
}

export default ContentAccount
