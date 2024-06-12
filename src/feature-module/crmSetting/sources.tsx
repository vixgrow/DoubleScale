import React from "react";
import { sourcesData } from "../../core/data/json/sources";
import Table from "../../core/common/dataTable/index";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import { TableData } from "../../core/data/interface";
import CollapseHeader from "../../core/common/collapse-header";
const route = all_routes;

const Sources = () => {
  const dataSource = sourcesData;
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
       sorter: (a: TableData, b: TableData) =>
        a.title.length - b.title.length,
      key: "title",
      width: "237px",
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
       sorter: (a: TableData, b: TableData) =>
        a.createdAt.length - b.createdAt.length,
      key: "createdAt",
      width: "235px",
    },
    {
      title: "Status",
      dataIndex: "status",
       sorter: (a: TableData, b: TableData) =>
        a.status.length - b.status.length,
      key: "status",
      width: "109px",
      render: (status: any) => (
        <span
          className={`${
            status == "Active"
              ? "badge badge-pill badge-status bg-success"
              : status == "Inactive"
              ? "badge badge-pill badge-status bg-danger"
              : ""
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: "90px",
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
              className="dropdown-item"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#edit_source"
            >
              <i className="ti ti-edit text-blue" /> Edit
            </Link>
            <Link
              className="dropdown-item"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#delete_source"
            >
              <i className="ti ti-trash text-danger" /> Delete
            </Link>
          </div>
        </div>
      ),
    },
  ];
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
                    <h4 className="page-title">
                      Sources<span className="count-title">123</span>
                    </h4>
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
                            placeholder="Search Source"
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
                                data-bs-target="#add_source"
                              >
                                <i className="ti ti-square-rounded-plus" />
                                Add New Sources
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Search */}
                  {/* Contact List */}
                  <div className="table-responsive custom-table">
                    <Table dataSource={dataSource} columns={columns} />
                  </div>
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <div className="datatable-length" />
                    </div>
                    <div className="col-md-6">
                      <div className="datatable-paginate" />
                    </div>
                  </div>
                  {/* /Contact List */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add New Source */}
      <div className="modal custom-modal fade" id="add_source" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Source</h5>
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
                <div className="form-wrap">
                  <label className="col-form-label">
                    Source Name <span className="text-danger">*</span>
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
                        defaultChecked
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
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
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
      {/* /Add New Source */}
      {/* Edit Source */}
      <div className="modal custom-modal fade" id="edit_source" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Source</h5>
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
                <div className="form-wrap">
                  <label className="col-form-label">
                    Source Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="Phone Calls"
                  />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">Status</label>
                  <div className="d-flex flex-wrap radio-wrap">
                    <div className="radio-btn">
                      <input
                        type="radio"
                        className="status-radio"
                        id="edit-active"
                        name="status"
                        defaultChecked
                      />
                      <label htmlFor="edit-active">Active</label>
                    </div>
                    <div className="radio-btn">
                      <input
                        type="radio"
                        className="status-radio"
                        id="edit-inactive"
                        name="status"
                      />
                      <label htmlFor="edit-inactive">Inactive</label>
                    </div>
                  </div>
                </div>
                <div className="modal-btn text-end">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Source */}
      {/* Delete Source */}
      <div className="modal custom-modal fade" id="delete_source" role="dialog">
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
                  <h3>Remove Source?</h3>
                  <p className="del-info">
                    Are you sure you want to remove it.
                  </p>
                  <div className="col-lg-12 text-center modal-btn">
                    <Link
                      to="#"
                      className="btn btn-light"
                      data-bs-dismiss="modal"
                    >
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
      {/* /Delete Source */}
    </div>
  );
};

export default Sources;
