import React, { useState } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import DateRangePicker from "react-bootstrap-daterangepicker";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
import { SelectWithImage2 } from "../../../core/common/selectWithImage2";
import Loader from "../../../core/common/loader";
const route = all_routes;
const ProjectDashboard = () => {
  const [chartOptions] = useState<any>({
    series: [44, 55, 41, 17],
    chart: {
      width: 400,
      height: 300,
      type: "donut",
    },
    legend: {
      position: "bottom",
    },
    colors: ["#4A00E5", "#FFA201", "#0092E4", "#E41F07"],
    labels: ["Campaigns", "Google", "Referrals", "Paid Social"],
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  });
  const [chartOptions2] = useState<any>({
    series: [
      {
        name: "",
        data: [1200, 1000, 800, 600, 400, 200],
      },
    ],
    chart: {
      type: "bar",
      height: 420,
    },
    plotOptions: {
      bar: {
        borderRadius: 0,
        horizontal: true,
        distributed: true,
        barHeight: "100%",
        isFunnel: true,
      },
    },
    colors: ["#4A00E5", "#1ECBE2", "#FF9D0A", "#00918E", "#5CB85C", "#FC0027"],
    dataLabels: {
      enabled: true,
      dropShadow: {
        enabled: true,
      },
    },
    xaxis: {
      categories: [
        "Inpipeline : 1454",
        "Follow Up : 1454",
        "Schedule service : 1454",
        "Conversation : 1454",
        "Win : 1454",
        "Lost : 1454",
      ],
    },
    legend: {
      show: false,
    },
  });
  const [chartOptions3] = useState<any>({
    series: [
      {
        data: [400, 220, 448],
        color: "#FC0027",
      },
    ],
    chart: {
      type: "bar",
      height: 150,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ["Conversation", "Follow Up", "Inpipeline"],
    },
  });
  const [chartOptions4] = useState<any>({
    series: [
      {
        data: [400, 220, 448],
        color: "#77D882",
      },
    ],
    chart: {
      type: "bar",
      height: 150,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ["Conversation", "Follow Up", "Inpipeline"],
    },
  });

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
  return (
    <div>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              <div className="page-header">
                <div className="row align-items-center ">
                  <div className="col-md-4">
                    <h3 className="page-title">Project Dashboard</h3>
                  </div>
                  <div className="col-md-8 float-end ms-auto">
                    <div className="d-flex title-head">
                      <div className="daterange-picker d-flex align-items-center justify-content-center">
                        <div className="form-sort me-2">
                          <i className="ti ti-calendar" />
                          <DateRangePicker initialSettings={initialSettings}>
                            <input
                              className="form-control  date-range bookingrange"
                              type="text"
                            />
                          </DateRangePicker>
                        </div>
                        <div className="head-icons mb-0">
                          <CollapseHeader />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-7">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Recent Projects
                        </h4>
                        <div className="dropdown statistic-dropdown">
                          <div className="card-select">
                            <ul>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  <i className="ti ti-calendar-check me-2" />
                                  Last 7 days
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 15 days
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 30 days
                                  </Link>
                                </div>
                              </li>
                              <li>
                                <Link
                                  className="btn btn-primary add-popup"
                                  to="#"
                                >
                                  <i className="ti ti-square-rounded-plus me-1" />
                                  Add Project
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="table-responsive custom-table">
                        <table
                          className="table dataTable no-footer"
                          id="recent-project"
                          style={{ width: "526px" }}
                        >
                          <thead className="thead-light">
                            <tr>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "106px" }}
                              >
                                Priority
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "167px" }}
                              >
                                Name
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "78px" }}
                              >
                                Client
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "79px" }}
                              >
                                Due Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="odd">
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.projectDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/priority/truellysel.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.projectDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    Truelysell
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.companyDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/company-icon-01.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.companyDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    NovaWave LLC
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <span className="badge badge-pill  bg-light-danger">
                                  <span className="badge-dots" /> High
                                </span>
                              </td>
                              <td>15 Oct 2023</td>
                            </tr>
                            <tr className="even">
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.projectDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/priority/dreamchat.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.projectDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    Dreamschat
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.companyDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/company-icon-02.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.companyDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    BlueSky Industries
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <span className="badge badge-pill  bg-light-warning">
                                  <span className="badge-dots" /> Medium
                                </span>
                              </td>
                              <td>22 Oct 2023</td>
                            </tr>
                            <tr className="odd">
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.projectDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/priority/truellysell.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.projectDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    Truelysell
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.companyDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/company-icon-03.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.companyDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    SilverHawk
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <span className="badge badge-pill  bg-light-danger">
                                  <span className="badge-dots" /> High
                                </span>
                              </td>
                              <td>27 Oct 2023</td>
                            </tr>
                            <tr className="even">
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.projectDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/priority/servbook.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.projectDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    Servbook
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.companyDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/company-icon-04.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.companyDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    SummitPeak
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <span className="badge badge-pill  bg-light-danger">
                                  <span className="badge-dots" /> High
                                </span>
                              </td>
                              <td>01 Oct 2023</td>
                            </tr>
                            <tr className="odd">
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.projectDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/priority/dream-pos.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.projectDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    DreamPOS
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <h2 className="table-avatar d-flex align-items-center">
                                  <Link
                                    to={route.companyDetails}
                                    className="company-img"
                                  >
                                    <ImageWithBasePath
                                      className="avatar-img"
                                      src="assets/img/icons/company-icon-05.svg"
                                      alt="User Image"
                                    />
                                  </Link>
                                  <Link
                                    to={route.companyDetails}
                                    className="profile-split d-flex flex-column"
                                  >
                                    RiverStone Ventur
                                  </Link>
                                </h2>
                              </td>
                              <td>
                                <span className="badge badge-pill  bg-light-warning">
                                  <span className="badge-dots" /> Medium
                                </span>
                              </td>
                              <td>06 Oct 2023</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-5 d-flex">
                  <div className="card w-100">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Projects By Stage
                        </h4>
                        <div className="dropdown statistic-dropdown">
                          <div className="card-select">
                            <ul>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Last 3 months
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 3 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 6 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="contacts-analysis">
                        <Chart
                          options={chartOptions}
                          series={chartOptions.series}
                          type={chartOptions.chart.type}
                          width={chartOptions.chart.width}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 d-flex">
                  <div className="card w-100">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Projects By Stage
                        </h4>
                        <div className="dropdown statistic-dropdown">
                          <div className="card-select">
                            <ul>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Sales Pipeline
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Marketing Pipeline
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Sales Pipeline
                                  </Link>
                                </div>
                              </li>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Last 3 months
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 3 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 6 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="project-stage">
                        <Chart
                          options={chartOptions2}
                          series={chartOptions2.series}
                          type={chartOptions2.chart.type}
                          height={chartOptions2.chart.height}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 ">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Leads By Stage
                        </h4>
                        <div className="dropdown statistic-dropdown">
                          <div className="card-select">
                            <ul>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Marketing Pipeline
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Marketing Pipeline
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Sales Pipeline
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Email
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Chats
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Operational
                                  </Link>
                                </div>
                              </li>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Last 3 months
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 3 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 6 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="last-chart">
                        <Chart
                          options={chartOptions3}
                          series={chartOptions3.series}
                          type={chartOptions3.chart.type}
                          height={chartOptions3.chart.height}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body ">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Won Deals Stage
                        </h4>
                        <div className="dropdown statistic-dropdown">
                          <div className="card-select">
                            <ul>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Marketing Pipeline
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Marketing Pipeline
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Sales Pipeline
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Email
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Chats
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Operational
                                  </Link>
                                </div>
                              </li>
                              <li>
                                <Link
                                  className="dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  to="#"
                                >
                                  Last 3 months
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 3 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 6 months
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="won-chart">
                        <Chart
                          options={chartOptions4}
                          series={chartOptions4.series}
                          type={chartOptions4.chart.type}
                          height={chartOptions4.chart.height}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add New Project */}
      <div className="toggle-popup">
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Project</h4>
            <Link to="#" className="sidebar-close toggle-btn">
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <form className="toggle-height">
              <div className="pro-create">
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Project ID<span className="text-danger"> *</span>
                      </label>
                      <input className="form-control" type="text" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Project Type <span className="text-danger">*</span>
                      </label>
                      <select className="select2">
                        <option>Choose</option>
                        <option>Mobile App</option>
                        <option>Meeting</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Client <span className="text-danger">*</span>
                      </label>
                      <select className="select">
                        <option>Select</option>
                        <option>NovaWave LLC</option>
                        <option>SilverHawk</option>
                        <option>HarborView</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select className="select">
                        <option>Select</option>
                        <option>HarborView</option>
                        <option>LLC</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Project Timing <span className="text-danger">*</span>
                      </label>
                      <select className="select">
                        <option>Select</option>
                        <option>Hourly</option>
                        <option>Minutes</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input className="form-control" type="text" />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Amount <span className="text-danger">*</span>
                      </label>
                      <input className="form-control" type="text" />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Total <span className="text-danger">*</span>
                      </label>
                      <input className="form-control" type="text" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Responsible Persons{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <SelectWithImage2 />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Team Leader <span className="text-danger">*</span>
                      </label>
                      <SelectWithImage2 />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <div className="icon-form">
                        <span className="form-icon">
                          <i className="ti ti-calendar-event" />
                        </span>
                        <input
                          type="text"
                          className="form-control datetimepicker"
                          defaultValue="29-02-2020"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Due Date <span className="text-danger">*</span>
                      </label>
                      <div className="icon-form">
                        <span className="form-icon">
                          <i className="ti ti-calendar-event" />
                        </span>
                        <input
                          type="text"
                          className="form-control datetimepicker"
                          defaultValue="29-02-2020"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Priority</label>
                      <select className="select">
                        <option>Select</option>
                        <option>High</option>
                        <option>Low</option>
                        <option>Medium</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">Status</label>
                      <select className="select">
                        <option>Select</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        defaultValue={""}
                      />
                    </div>
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
          </div>
        </div>
      </div>
      {/* /Add New Project */}
      {/* Delete Contact */}
      <div
        className="modal custom-modal fade"
        id="delete_contact"
        role="dialog"
      >
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
              <div className="success-message text-center">
                <div className="success-popup-icon">
                  <i className="ti ti-trash-x" />
                </div>
                <h3>Remove Contacts?</h3>
                <p className="del-info">
                  Are you sure you want to remove contact you selected.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to={route.contactList} className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Contact */}
      {/* Create Contact */}
      <div
        className="modal custom-modal fade"
        id="create_contact"
        role="dialog"
      >
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
              <div className="success-message text-center">
                <div className="success-popup-icon bg-light-blue">
                  <i className="ti ti-user-plus" />
                </div>
                <h3>Contact Created Successfully!!!</h3>
                <p>View the details of contact, created</p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to={route.contactDetails} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Create Contact */}
      {/* Add Event Modal */}
      <div id="dwnld_report" className="modal custom-modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Download Report</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">
                    File Type <span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>Download as PDF</option>
                    <option>Download as Excel</option>
                  </select>
                </div>
                <div className="mb-3">
                  <h5>Filters</h5>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    File Type <span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>All Fields</option>
                    <option>Name</option>
                    <option>Position</option>
                    <option>Owner</option>
                    <option>Location</option>
                    <option>Phone</option>
                    <option>Date Created</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Position<span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>All Position</option>
                    <option>Installer</option>
                    <option>Senior Manager</option>
                    <option>Test Engineer</option>
                    <option>UI /UX Designer</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Source<span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>All Source</option>
                    <option>Google</option>
                    <option>Campaigns </option>
                    <option>Referrals</option>
                    <option>Paid Social</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Select Year<span className="text-danger">*</span>
                  </label>
                  <select className="select">
                    <option>2023</option>
                    <option>2022</option>
                    <option>2021</option>
                  </select>
                </div>
                <div className="col-lg-12 text-end modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-primary">
                    Download Now
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Event Modal */}
      <Loader />
    </div>
  );
};

export default ProjectDashboard;
