import Table from "../../core/common/dataTable/index";
import { taskReportsData } from "../../core/json/tasReport";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import React, { useState } from "react";
import Chart from "react-apexcharts";
import DateRangePicker from "react-bootstrap-daterangepicker";
import Reports_modal from "../../core/modals/reports_modal";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import { TableData } from "../../core/data/interface";
import CollapseHeader from "../../core/common/collapse-header";
import Select from "react-select";
import { customStyles, options1 } from "../../core/common/selectoption/selectoption";

const route = all_routes;

const TaskReport = () => {
  const initialSettings = {
    endDate: new Date("2020-08-11T12:30:00.000Z"),
    ranges: {
      "Last 30 Days": [
        new Date("2020-07-12T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      "Last 7 Days": [
        new Date("2020-08-04T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      "Last Month": [
        new Date("2020-06-30T18:30:00.000Z"),
        new Date("2020-07-31T18:29:59.999Z"),
      ],
      "This Month": [
        new Date("2020-07-31T18:30:00.000Z"),
        new Date("2020-08-31T18:29:59.999Z"),
      ],
      Today: [
        new Date("2020-08-10T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      Yesterday: [
        new Date("2020-08-09T04:57:17.076Z"),
        new Date("2020-08-09T04:57:17.076Z"),
      ],
    },
    startDate: new Date("2020-08-04T04:57:17.076Z"), // Set "Last 7 Days" as default
    timePicker: false,
  };
  const [chartOptions1] = useState<any>({
    series: [44, 55, 41, 17],
    chart: {
      type: "donut",
    },
    colors: ["#4A00E5", "#0092E4", "#E41F07", "#FFA201"],
    dataLabels: {
      enabled: false,
    },
    title: {
      text: "",
      align: "left",
    },
  });

  const [chartOptions2] = useState<any>({
    series: [
      {
        name: "Task",
        data: [10, 38, 18, 47, 13, 32, 15, 40, 18, 50, 30, 15],
      },
    ],
    colors: ["#3C2371"],
    chart: {
      height: 273,
      type: "line",
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "stepline",
    },
    title: {
      text: "",
      align: "left",
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
  });
  const dataSource = taskReportsData;
  const columns = [
    {
      title: "",
      dataIndex: "star",
      width: "35px",
      render: () => (
        <div className="set-star rating-select">
          <i className="fa fa-star" />
        </div>
      ),
    },
    {
      title: "Task Name",
      dataIndex: "taskName",
      sorter: (a: TableData, b: TableData) =>
        a.taskName.length - b.taskName.length,
      width: "269px",
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      sorter: (a: TableData, b: TableData) =>
        a.assignedTo.length - b.assignedTo.length,
      key: "assignedTo",
      render: (text: any, record: any) => (
        <h2 className="table-avatar d-flex align-items-center">
          <Link to="#" className="avatar">
            <ImageWithBasePath
              className="avatar-img"
              src="assets/img/profiles/avatar-14.jpg"
              alt="User Image"
            />
          </Link>
          <Link to="#" className="profile-split d-flex flex-column">
            {text}
          </Link>
        </h2>
      ),
      width: "180px",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      sorter: (a: TableData, b: TableData) =>
        a.priority.length - b.priority.length,
      key: "priority",
      ellipsis: true,
      render: (priority: any) => (
        <span
          className={`${
            priority === "High"
              ? "priority badge badge-tag badge-danger-light"
              : priority === "Medium"
              ? "priority badge badge-tag badge-warning-light"
              : priority === "Low"
              ? "priority badge badge-tag badge-success-light"
              : ""
          }`}
        >
          <i className="ti ti-square-rounded-filled" />
          {priority}
        </span>
      ),
      width: "150px",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      sorter: (a: TableData, b: TableData) =>
        a.dueDate.length - b.dueDate.length,
      width: "100px",
    },
    {
      title: "Type",
      dataIndex: "type",
      sorter: (a: TableData, b: TableData) => a.type.length - b.type.length,
      width: "80px",
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a: TableData, b: TableData) => a.status.length - b.status.length,
      key: "status",
      render: (status: string) => (
        <span
          className={`badge badge-pill badge-status ${
            status === "Completed" ? "bg-success" : "bg-warning"
          }`}
        >
          {status}
        </span>
      ),
      width: "100px",
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      sorter: (a: TableData, b: TableData) =>
        a.createdDate.length - b.createdDate.length,
      width: "135px",
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
                    Task Reports <span className="count-title">123</span>
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
                          placeholder="Search Tasks"
                        />
                      </div>
                    </div>
                    <div className="col-md-7 col-sm-8">
                      <div className="filter-list">
                        <ul>
                          <li>
                            <div>
                              <Link
                                to="download_report"
                                className="btn btn-primary"
                                data-bs-toggle="modal"
                                data-bs-target="#download_report"
                              >
                                <i className="ti ti-file-download me-2" />
                                Download Report
                              </Link>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Search */}
                <div className="row">
                  <div className="col-md-7 d-flex">
                    <div className="card report-card flex-fill">
                      <div className="card-body">
                        <div className="statistic-header report-header">
                          <h4>Tasks by Year</h4>
                          <div className="statistic-dropdown">
                            <div className="icon-form">
                              <span className="form-icon">
                                <i className="ti ti-calendar" />
                              </span>
                              <DateRangePicker
                                initialSettings={initialSettings}
                              >
                                <input
                                  className="form-control  date-range bookingrange"
                                  type="text"
                                />
                              </DateRangePicker>
                            </div>
                          </div>
                        </div>
                        <div id="task-year">
                          <Chart
                            series={chartOptions2.series}
                            options={chartOptions2}
                            type="line"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5 d-flex">
                    <div className="card report-card flex-fill">
                      <div className="card-body">
                        <div className="statistic-header report-header">
                          <h4>Tasks by Type</h4>
                          <div className="statistic-dropdown">
                            <div className="icon-form">
                              <span className="form-icon">
                                <i className="ti ti-calendar" />
                              </span>
                              <DateRangePicker
                                initialSettings={initialSettings}
                              >
                                <input
                                  className="form-control  date-range bookingrange"
                                  type="text"
                                />
                              </DateRangePicker>
                            </div>
                          </div>
                        </div>
                        <div id="task-type">
                          <Chart
                            series={chartOptions1.series}
                            options={chartOptions1}
                            type="donut"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card report-card-table">
                  <div className="card-body">
                    {/* Filter */}
                    <div className="filter-section filter-flex">
                      <div className="sortby-list">
                        <ul>
                          <li>
                            <div className="sort-dropdown drop-down">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                              >
                                <i className="ti ti-sort-ascending-2" />
                                Sort{" "}
                              </Link>
                              <div className="dropdown-menu  dropdown-menu-start">
                                <ul>
                                  <li>
                                    <Link to="#">
                                      <i className="ti ti-circle-chevron-right" />
                                      Ascending
                                    </Link>
                                  </li>
                                  <li>
                                    <Link to="#">
                                      <i className="ti ti-circle-chevron-right" />
                                      Descending
                                    </Link>
                                  </li>
                                  <li>
                                    <Link to="#">
                                      <i className="ti ti-circle-chevron-right" />
                                      Recently Viewed
                                    </Link>
                                  </li>
                                  <li>
                                    <Link to="#">
                                      <i className="ti ti-circle-chevron-right" />
                                      Recently Added
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-wrap icon-form">
                              <span className="form-icon">
                                <i className="ti ti-calendar" />
                              </span>
                              <DateRangePicker
                                initialSettings={initialSettings}
                              >
                                <input
                                  className="form-control  date-range bookingrange"
                                  type="text"
                                />
                              </DateRangePicker>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <div className="filter-list">
                        <ul>
                          <li>
                            <div className="manage-dropdwon">
                              <Link
                                to="#"
                                className="btn btn-purple-light"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="false"
                              >
                                <i className="ti ti-columns-3" />
                                Manage Columns
                              </Link>
                              <div className="dropdown-menu  dropdown-menu-md-end">
                                <h4>Want to manage datatables?</h4>
                                <p>
                                  Please drag and drop your column to reorder
                                  your table and enable see option as you want.
                                </p>
                                <ul>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Task Name
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-name"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-name"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Assigned To
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-phone"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-phone"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Priority
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-email"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-email"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Due Date{" "}
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-tag"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-tag"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Type
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-loc"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-loc"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Status
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-rate"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-rate"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Created Date
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-owner"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-owner"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="form-sorts dropdown">
                              <Link
                                to="#"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="false"
                              >
                                <i className="ti ti-filter-share" />
                                Filter
                              </Link>
                              <div className="filter-dropdown-menu dropdown-menu  dropdown-menu-md-end">
                              <div className="filter-set-view">
                                <div className="filter-set-head">
                                  <h4>
                                    <i className="ti ti-filter-share" />
                                    Filter
                                  </h4>
                                  
                                </div>
                              
                                <div
                                  className="accordion"
                                  id="accordionExample"
                                >
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <Link
                                        to="#"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#collapseTwo"
                                        aria-expanded="true"
                                        aria-controls="collapseTwo"
                                      >
                                        Country
                                      </Link>
                                    </div>
                                    <div
                                      className="filter-set-contents accordion-collapse collapse show"
                                      id="collapseTwo"
                                      data-bs-parent="#accordionExample"
                                    >
                                      <div className="filter-content-list">
                                        <div className="form-wrap icon-form">
                                          <span className="form-icon">
                                            <i className="ti ti-search" />
                                          </span>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search Country"
                                          />
                                        </div>
                                        <ul>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input
                                                  type="checkbox"
                                                  defaultChecked
                                                />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>India</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>USA</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>France</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>United Kingdom</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>UAE</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Italy</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Japan</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Germany</h5>
                                            </div>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <Link
                                        to="#"
                                        className="collapsed"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#owner"
                                        aria-expanded="false"
                                        aria-controls="owner"
                                      >
                                        Owner
                                      </Link>
                                    </div>
                                    <div
                                      className="filter-set-contents accordion-collapse collapse"
                                      id="owner"
                                      data-bs-parent="#accordionExample"
                                    >
                                      <div className="filter-content-list">
                                        <div className="form-wrap icon-form">
                                          <span className="form-icon">
                                            <i className="ti ti-search" />
                                          </span>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search Owner"
                                          />
                                        </div>
                                        <ul>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input
                                                  type="checkbox"
                                                  defaultChecked
                                                />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Hendry</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Guillory</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Jami</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Theresa</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Espinosa</h5>
                                            </div>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <Link
                                        to="#"
                                        className="collapsed"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#Status"
                                        aria-expanded="false"
                                        aria-controls="Status"
                                      >
                                        Status
                                      </Link>
                                    </div>
                                    <div
                                      className="filter-set-contents accordion-collapse collapse"
                                      id="Status"
                                      data-bs-parent="#accordionExample"
                                    >
                                      <div className="filter-content-list">
                                        <ul>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input
                                                  type="checkbox"
                                                  defaultChecked
                                                />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Active</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Inactive</h5>
                                            </div>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <Link
                                        to="#"
                                        className="collapsed"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#collapseOne"
                                        aria-expanded="false"
                                        aria-controls="collapseOne"
                                      >
                                        Rating
                                      </Link>
                                    </div>
                                    <div
                                      className="filter-set-contents accordion-collapse collapse"
                                      id="collapseOne"
                                      data-bs-parent="#accordionExample"
                                    >
                                      <div className="filter-content-list">
                                        <ul>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input
                                                  type="checkbox"
                                                  defaultChecked
                                                />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="rating">
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <span>5.0</span>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="rating">
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star" />
                                              <span>4.0</span>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="rating">
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <span>3.0</span>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="rating">
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <span>2.0</span>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="rating">
                                              <i className="fa fa-star filled" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <i className="fa fa-star" />
                                              <span>1.0</span>
                                            </div>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="filter-set-content">
                                    <div className="filter-set-content-head">
                                      <Link
                                        to="#"
                                        className="collapsed"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#collapseThree"
                                        aria-expanded="false"
                                        aria-controls="collapseThree"
                                      >
                                        Tags
                                      </Link>
                                    </div>
                                    <div
                                      className="filter-set-contents accordion-collapse collapse"
                                      id="collapseThree"
                                      data-bs-parent="#accordionExample"
                                    >
                                      <div className="filter-content-list">
                                        <ul>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input
                                                  type="checkbox"
                                                  defaultChecked
                                                />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Promotion</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Rated</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Rejected</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Collab</h5>
                                            </div>
                                          </li>
                                          <li>
                                            <div className="filter-checks">
                                              <label className="checkboxs">
                                                <input type="checkbox" />
                                                <span className="checkmarks" />
                                              </label>
                                            </div>
                                            <div className="collapse-inside-text">
                                              <h5>Calls</h5>
                                            </div>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="filter-reset-btns">
                                  <div className="row">
                                    <div className="col-6">
                                      <Link to="#" className="btn btn-light">
                                        Reset
                                      </Link>
                                    </div>
                                    <div className="col-6">
                                      <Link
                                        to={route.contactList}
                                        className="btn btn-primary"
                                      >
                                        Filter
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Filter */}
                    {/* Report List */}
                    <div className="table-responsive custom-table">
                      <Table columns={columns} dataSource={dataSource} />
                    </div>
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="datatable-length" />
                      </div>
                      <div className="col-md-6">
                        <div className="datatable-paginate" />
                      </div>
                    </div>
                    {/* /Report List */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Reports_modal />
    </div>
  );
};

export default TaskReport;
