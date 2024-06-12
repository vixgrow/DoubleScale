import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../feature-module/router/all_routes';
const route = all_routes;

const CurrenciesModal = () => {
  return (

  <div>
  {/* Add Currency */}
  <div className="modal custom-modal fade" id="add_currency" role="dialog">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Add Currency</h5>
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
          <form >
            <div className="form-wrap">
              <label className="col-form-label">Currency Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Code <span className="text-danger">*</span></label>
              <input type="text" className="form-control" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Symbol <span className="text-danger">*</span></label>
              <input type="text" className="form-control" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Exchange Rate <span className="text-danger">*</span></label>
              <input type="text" className="form-control" />
            </div>
            <div className="modal-btn">
              <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
              <Link to="#" className="btn btn-primary">Save</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  {/* /Add Currency */}
  {/* Edit Currency */}
  <div className="modal custom-modal fade" id="edit_currency" role="dialog">
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
          <form >
            <div className="form-wrap">
              <label className="col-form-label">Currency Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" defaultValue="Euro" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Code <span className="text-danger">*</span></label>
              <input type="text" className="form-control" defaultValue="EUR" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Symbol <span className="text-danger">*</span></label>
              <input type="text" className="form-control" defaultValue="€" />
            </div>
            <div className="form-wrap">
              <label className="col-form-label">Exchange Rate <span className="text-danger">*</span></label>
              <input type="text" className="form-control" defaultValue="Default" />
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
  {/* /Edit Currency */}
  {/* Delete Account */}
  <div className="modal custom-modal fade" id="delete_currency" role="dialog">
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
            <h3>Remove Currency?</h3>
            <p className="del-info">Are you sure you want to remove it.</p>
            <div className="col-lg-12 text-center modal-btn">
              <Link to="#" className="btn btn-light" data-bs-dismiss="modal">Cancel</Link>
              <Link to={route.currencies} className="btn btn-danger">Yes, Delete it</Link>
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

export default CurrenciesModal