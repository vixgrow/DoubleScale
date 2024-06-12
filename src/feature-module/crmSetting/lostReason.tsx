import React from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { lostReason } from "../../core/data/json/lostreason";
import CollapseHeader from "../../core/common/collapse-header";
const LostReason = () => {

    const data = lostReason;
  
    const columns = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        sorter: true,
      },
      {
        title: "Created at",
        dataIndex: "created_date",
        key: "created_date",
        sorter: true,
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (text: string) => (
          <div>
            {text === "Active" && (
              <span className="badge badge-pill badge-status bg-success">
                {text}
              </span>
            )}
  
            {text === "Inactive" && (
              <span className="badge badge-pill badge-status bg-danger">
                {text}
              </span>
            )}
          </div>
        ),
        sorter: true,
      },
      {
        title: "Action",
        dataIndex: "action",
        render: () => (
          <div className="dropdown table-action">
            <Link
              to="#"
              className="action-icon "
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="fa fa-ellipsis-v" />
            </Link>
            <div className="dropdown-menu dropdown-menu-right">
              <Link
                to="#"
              
                data-bs-toggle="modal"
                data-bs-target="#add_reason"
              >
                <i className="ti ti-edit text-blue" /> Edit
              </Link>
  
              <Link
                className="dropdown-item"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#delete_reason"
              >
                <i className="ti ti-trash text-danger"></i> Delete
              </Link>
            </div>
          </div>
        ),
      },
    ];
  
    return (
      <>
        <div className="page-wrapper">
          <div className="content">
            <div className="row">
              <div className="col-md-12">
                {/* Page Header */}
                <div className="page-header">
                  <div className="row align-items-center">
                    <div className="col-sm-8">
                      <h4 className="page-title">
                        Lost Reason <span className="count-title">123</span>
                      </h4>
                    </div>
                    <div className="col-sm-4 text-sm-end">
                      <div className="head-icons">
                        <CollapseHeader />
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Page Header */}
                <div className="card main-card">
                  <div className="card-body">
                    {/* Search */}
                    <div className="search-section">
                      <div className="row">
                        <div className="col-md-5 col-sm-4">
                          <div className="form-wrap icon-form">
                            <span className="form-icon">
                              <i className="ti ti-search" />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search Lost Reason"
                            />
                          </div>
                        </div>
                        <div className="col-md-7 col-sm-8">
                          <div className="export-list text-sm-end">
                            <ul>
                              <li>
                                <Link
                                  to="#"
                                  className="btn btn-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#add_reason"
                                >
                                  <i className="ti ti-square-rounded-plus" />
                                  Add New Reason
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /Search */}
                    {/* Reason List */}
                    <div className="table-responsive custom-table">
                      <Table dataSource={data} columns={columns} />
                      {/* {loading ? (
                      <div>Loading...</div>
                  ) : (
                      <Table dataSource={dataSource} columns={columns} />
                  )} */}
                    </div>
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="datatable-length" />
                      </div>
                      <div className="col-md-6">
                        <div className="datatable-paginate" />
                      </div>
                    </div>
                    {/* /Reason List */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <>
          {/* Add New Reason */}
          <div className="modal custom-modal fade" id="add_reason" role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Reason</h5>
                  <button
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <div className="modal-body">
                  <form action="/lost-reason">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Reason <span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="form-wrap">
                      <label className="col-form-label">Status</label>
                      <div className="d-flex flex-wrap radio-wrap">
                        <div className="radio-btn">
                          <input
                            type="radio"
                            className="status-radio"
                            id="add-active"
                            name="status"
                            defaultChecked={true}
                          />
                          <label htmlFor="add-active">Active</label>
                        </div>
                        <div className="radio-btn">
                          <input
                            type="radio"
                            className="status-radio"
                            id="add-inactive"
                            name="status"
                          />
                          <label htmlFor="add-inactive">Inactive</label>
                        </div>
                      </div>
                    </div>
                    <div className="modal-btn text-end">
                      <Link
                        to="#"
                        className="btn btn-light"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </Link>
                      <button type="submit" className="btn btn-primary">
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* /Add New Reason */}
          <div className="modal custom-modal fade" id="delete_reason" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 m-0 justify-content-end">
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="success-message text-center">
                    <div className="success-popup-icon">
                      <i className="ti ti-trash-x" />
                    </div>
                    <h3>Remove Reason?</h3>
                    <p className="del-info">Are you sure you want to remove it.</p>
                    <div className="col-lg-12 text-center modal-btn">
                      <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                        Cancel
                      </Link>
                      <button type="submit" className="btn btn-danger">
                        Yes, Delete it
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
  
        </>
      </>
    );
}

export default LostReason