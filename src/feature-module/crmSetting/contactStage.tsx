import React from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import { contactStageData } from "../../core/json/contactStage_data";
import ContactStageModal from "../../core/modals/contactStageModal";
import Table from "../../core/common/dataTable/index";
import CollapseHeader from "../../core/common/collapse-header";

const ContactStage = () => {
  const route = all_routes;

  const data = contactStageData;

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a: any, b: any) => a.title.length - b.title.length,
    },

    {
      title: "Created At",
      dataIndex: "created_date",
      sorter: (a: any, b: any) => a.created_date.length - b.created_date.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: any, record: any) => (
        <span
          className={`badge badge-pill badge-status ${
            record?.status == "Active" ? "bg-success" : "bg-danger"
          }`}
        >
          {record?.status}
        </span>
      ),
      sorter: (a: any, b: any) => a.status - b.status.length,
    },
    {
      title: "Action",
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
              data-bs-target="#edit_contact_stage"
            >
              <i className="ti ti-edit text-blue" /> Edit
            </Link>
            <Link
              className="dropdown-item"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#delete_contact_stage"
            >
              <i className="ti ti-trash text-danger" /> Delete
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            {/* Page Header */}
            <div className="page-header">
              <div className="row align-items-center">
                <div className="col-sm-8">
                  <h4 className="page-title">
                    Contact Stages <span className="count-title">123</span>
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
                          placeholder="Search Contact Stages"
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
                              data-bs-target="#add_contact_stage"
                            >
                              <i className="ti ti-square-rounded-plus" />
                              Add New Stages
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Search */}
                {/* Contact Stage List */}
                <div className="table-responsive custom-table">
                  <Table
                    columns={columns}
                    dataSource={data}
                  />
                </div>
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <div className="datatable-length" />
                  </div>
                  <div className="col-md-6">
                    <div className="datatable-paginate" />
                  </div>
                </div>
                {/* /Contact Stage List */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContactStageModal />
    </div>
  );
};

export default ContactStage;
