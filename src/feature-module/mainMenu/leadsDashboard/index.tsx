import React, {useEffect, useState} from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import DateRangePicker from "react-bootstrap-daterangepicker";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
import Loader from "../../../core/common/loader";
const route = all_routes;
const LeadsDashboard = () => {
  const [chartOptions] = useState<any>( {
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
  const [chartOptions2] = useState<any>( {
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
  const [chartOptions3] = useState<any>({
    series: [44, 55, 13, 43],
    options: {
      chart: {
        width: 400,
        height: 300,
        type: "pie",
      },
      legend: {
        position: "bottom",
      },
      labels: ["Inpipeline", "Follow Up", "Schedule Service", "Conversation"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 275,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
  });

  
    const chartElement = document.querySelector("#leadpiechart");
    if (chartElement) {
      const options = {
        series: chartOptions3.series,
        chart: {
          width: 400,
          type: "pie",
        },
        legend: {
          position: "bottom",
        },
        labels: chartOptions3.options.labels,
        responsive: chartOptions3.options.responsive,
      };

      const chart = new ApexCharts(chartElement, options);
      chart.render();
    }
 





  // const [chartOptions3] = useState<any>( {
  //   series: [44, 55, 13, 43],
  //   options: {
  //     chart: {
  //       width: 400,
  //       height: 300,
  //       type: "pie",
  //     },
  //     legend: {
  //       position: "bottom",
  //     },
  //     labels: ["Inpipeline", "Follow Up", "Schedule Service", "Conversation"],
  //     responsive: [
  //       {
  //         breakpoint: 480,
  //         options: {
  //           chart: {
  //             width: 275,
  //           },
  //           legend: {
  //             position: "bottom",
  //           },
  //         },
  //       },
  //     ],
  //   },
  // });
  const [chartOptions4] = useState<any>( {
    series: [
      {
        name: "Reports",
        data: [40, 30, 20, 30, 22, 20, 30, 20, 22, 30, 15, 20],
      },
    ],
    colors: ["#4A00E5"],
    chart: {
      height: 273,
      type: "area",
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
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
    yaxis: {
      min: 10,
      max: 60,
      tickAmount: 5,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
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
                    <h3 className="page-title">Leads Dashboard</h3>
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
                          Recently Created Leads
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
                                  Last 30 days
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
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="table-responsive custom-table">
                        <table
                          className="table dataTable no-footer"
                          id="lead-project"
                          style={{ width: "528px" }}
                        >
                          <thead className="thead-light">
                            <tr>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "77px" }}
                              >
                                Lead Name
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "167px" }}
                              >
                                Company Name
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "92px" }}
                              >
                                Phone
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "96px" }}
                              >
                                Lead Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="odd">
                              <td>Collins</td>
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
                                    NovaWave LLC<span>Newyork, USA </span>
                                  </Link>
                                </h2>
                              </td>
                              <td>+1 875455453</td>
                              <td>
                                <span className="badge badge-pill  bg-pending">
                                  {" "}
                                  Not Contacted
                                </span>
                              </td>
                            </tr>
                            <tr className="even">
                              <td>Konopelski</td>
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
                                    <span>Winchester, KY </span>
                                  </Link>
                                </h2>
                              </td>
                              <td>+1 989757485</td>
                              <td>
                                <span className="badge badge-pill  bg-warning">
                                  {" "}
                                  Contacted
                                </span>
                              </td>
                            </tr>
                            <tr className="odd">
                              <td>Adams</td>
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
                                    SilverHawk<span>Jametown, NY </span>
                                  </Link>
                                </h2>
                              </td>
                              <td>+1 546555455</td>
                              <td>
                                <span className="badge badge-pill  bg-warning">
                                  {" "}
                                  Contacted
                                </span>
                              </td>
                            </tr>
                            <tr className="even">
                              <td>Schumm</td>
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
                                    SummitPeak<span>Compton, RI </span>
                                  </Link>
                                </h2>
                              </td>
                              <td>+1 454478787</td>
                              <td>
                                <span className="badge badge-pill  bg-pending">
                                  {" "}
                                  Not Contacted
                                </span>
                              </td>
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
                                  Last 30 Days
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 30 Days
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 15 Days
                                  </Link>
                                  <Link
                                    to="#"
                                    className="dropdown-item"
                                  >
                                    Last 7 Days
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="leadpiechart">
      <Chart
        options={chartOptions3.options}
        series={chartOptions3.series}
        type="pie"
        width={chartOptions3.options.chart.width}
        height={chartOptions3.options.chart.height}
      />
    </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 d-flex">
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
                      <div id="contact-report">
                        <Chart
                        options={chartOptions4}
                          series={chartOptions4.series}
                          type="area"
                          height={chartOptions4.chart.height}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
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
                          options={chartOptions}
                          series={chartOptions.series}
                          type={chartOptions.chart.type}
                          height={chartOptions.chart.height}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
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
                        {" "}
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
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add Contact */}
      <div className="toggle-popup">
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Contact</h4>
            <Link to="#" className="sidebar-close toggle-btn">
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <div className="pro-create">
              <form >
                <div className="accordion-lists" id="list-accord">
                  {/* Basic Info */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#basic"
                    >
                      <span>
                        <i className="ti ti-user-plus" />
                      </span>
                      Basic Info
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="basic"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="profile-pic-upload">
                              <div className="profile-pic">
                                <span>
                                  <i className="ti ti-photo" />
                                </span>
                              </div>
                              <div className="upload-content">
                                <div className="upload-btn">
                                  <input type="file" />
                                  <span>
                                    <i className="ti ti-file-broken" />
                                    Upload File
                                  </span>
                                </div>
                                <p>JPG, GIF or PNG. Max size of 800K</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                First Name{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Last Name <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Job Title <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Name
                              </label>
                              <select className="select2">
                                <option>Choose</option>
                                <option>NovaWave LLC</option>
                                <option>BlueSky Industries</option>
                                <option>SilverHawk</option>
                                <option>SummitPeak</option>
                                <option>RiverStone Ventur</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <div className="d-flex justify-content-between align-items-center">
                                <label className="col-form-label">
                                  Email <span className="text-danger">*</span>
                                </label>
                                <div className="status-toggle small-toggle-btn d-flex align-items-center">
                                  <span className="me-2 label-text">
                                    Email Opt Out
                                  </span>
                                  <input
                                    type="checkbox"
                                    id="user"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="user"
                                    className="checktoggle"
                                  />
                                </div>
                              </div>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Phone 1 <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Phone 2</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Fax <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Deals</label>
                              <select className="select2">
                                <option>Choose</option>
                                <option>Collins</option>
                                <option>Konopelski</option>
                                <option>Adams</option>
                                <option>Schumm</option>
                                <option>Wisozk</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Date of Birth
                              </label>
                              <div className="icon-form-end">
                                <span className="form-icon">
                                  <i className="ti ti-calendar-event" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control datetimepicker"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Reviews </label>
                              <div className="icon-form-end">
                                <span className="form-icon">
                                  <i className="ti ti-star" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="4.2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Owner</label>
                              <select className="select2">
                                <option>Choose</option>
                                <option>Hendry</option>
                                <option>Guillory</option>
                                <option>Jami</option>
                                <option>Theresa</option>
                                <option>Espinosa</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Tags </label>
                              <input
                                className="input-tags form-control"
                                type="text"
                                data-role="tagsinput"
                                name="Label"
                                defaultValue="Tag1"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Source <span className="text-danger">*</span>
                              </label>
                              <select className="select2">
                                <option>Choose</option>
                                <option>Phone Calls</option>
                                <option>Social Media</option>
                                <option>Referral Sites</option>
                                <option>Web Analytics</option>
                                <option>Previous Purchases</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Industry <span className="text-danger">*</span>
                              </label>
                              <select className="select">
                                <option>Choose</option>
                                <option>Retail Industry</option>
                                <option>Banking</option>
                                <option>Hotels</option>
                                <option>Financial Services</option>
                                <option>Insurance</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Language <span className="text-danger">*</span>
                              </label>
                              <select className="select">
                                <option>Choose</option>
                                <option>English</option>
                                <option>Arabic</option>
                                <option>Chinese</option>
                                <option>Hindi</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">
                                Description{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <textarea
                                className="form-control"
                                rows={5}
                                defaultValue={""}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Basic Info */}
                  {/* Address Info */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#address"
                    >
                      <span>
                        <i className="ti ti-map-pin-cog" />
                      </span>
                      Address Info
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="address"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Street Address{" "}
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">City </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                State / Province{" "}
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
                              <label className="col-form-label">Country</label>
                              <select className="select">
                                <option>Choose</option>
                                <option>India</option>
                                <option>USA</option>
                                <option>France</option>
                                <option>UK</option>
                                <option>UAE</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">Zipcode </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Address Info */}
                  {/* Social Profile */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#social"
                    >
                      <span>
                        <i className="ti ti-social" />
                      </span>
                      Social Profile
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="social"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Facebook</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Skype </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Linkedin{" "}
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Twitter</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
                              <label className="col-form-label">Whatsapp</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">
                                Instagram
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Social Profile */}
                  {/* Access */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#access"
                    >
                      <span>
                        <i className="ti ti-accessible" />
                      </span>
                      Access
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="access"
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="radio-wrap form-wrap">
                              <label className="col-form-label">
                                Visibility
                              </label>
                              <div className="d-flex flex-wrap">
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="public"
                                    name="visible"
                                  />
                                  <label htmlFor="public">Public</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="private"
                                    name="visible"
                                  />
                                  <label htmlFor="private">Private</label>
                                </div>
                                <div
                                  className="radio-btn"
                                  data-bs-toggle="modal"
                                  data-bs-target="#access_view"
                                >
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="people"
                                    name="visible"
                                  />
                                  <label htmlFor="people">Select People</label>
                                </div>
                              </div>
                            </div>
                            <div className="radio-wrap">
                              <label className="col-form-label">Status</label>
                              <div className="d-flex flex-wrap">
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="active"
                                    name="status"
                                    defaultChecked
                                  />
                                  <label htmlFor="active">Active</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="inactive"
                                    name="status"
                                  />
                                  <label htmlFor="inactive">Inactive</label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Access */}
                </div>
                <div className="submit-button text-end">
                  <Link to="#" className="btn btn-light">
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#create_contact"
                    className="btn btn-primary"
                  >
                    Create
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Contact */}
      {/* Edit Contact */}
      <div className="toggle-popup1">
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Edit Contact</h4>
            <Link to="#" className="sidebar-close1 toggle-btn">
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <div className="pro-create">
              <form >
                <div className="accordion-lists" id="list-accords">
                  {/* Basic Info */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#edit-basic"
                    >
                      <span>
                        <i className="ti ti-user-plus" />
                      </span>
                      Basic Info
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="edit-basic"
                      data-bs-parent="#list-accords"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="profile-pic-upload">
                              <div className="profile-pic">
                                <span>
                                  <i className="ti ti-photo" />
                                </span>
                              </div>
                              <div className="upload-content">
                                <div className="upload-btn">
                                  <input type="file" />
                                  <span>
                                    <i className="ti ti-file-broken" />
                                    Upload File
                                  </span>
                                </div>
                                <p>JPG, GIF or PNG. Max size of 800K</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                First Name{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Darlee"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Last Name <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Robertson"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Job Title <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Facility Manager"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Name
                              </label>
                              <select className="select2">
                                <option>Choose</option>
                                <option selected>NovaWave LLC</option>
                                <option>BlueSky Industries</option>
                                <option>SilverHawk</option>
                                <option>SummitPeak</option>
                                <option>RiverStone Ventur</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <div className="d-flex justify-content-between align-items-center">
                                <label className="col-form-label">
                                  Email <span className="text-danger">*</span>
                                </label>
                                <div className="status-toggle small-toggle-btn d-flex align-items-center">
                                  <span className="me-2 label-text">
                                    Email Opt Out
                                  </span>
                                  <input
                                    type="checkbox"
                                    id="user2"
                                    className="check"
                                    defaultChecked
                                  />
                                  <label
                                    htmlFor="user2"
                                    className="checktoggle"
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="robertson@example.com"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Phone 1 <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={1234567890}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Phone 2</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Fax <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Deals</label>
                              <select className="select2">
                                <option>Choose</option>
                                <option selected>Collins</option>
                                <option>Konopelski</option>
                                <option>Adams</option>
                                <option>Schumm</option>
                                <option>Wisozk</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Date of Birth
                              </label>
                              <div className="icon-form-end">
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
                              <label className="col-form-label">Reviews </label>
                              <div className="icon-form-end">
                                <span className="form-icon">
                                  <i className="ti ti-star" />
                                </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="4.2"
                                  defaultValue="4.2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Owner</label>
                              <select className="select2">
                                <option>Choose</option>
                                <option selected>Hendry</option>
                                <option>Guillory</option>
                                <option>Jami</option>
                                <option>Theresa</option>
                                <option>Espinosa</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Tags </label>
                              <input
                                className="input-tags form-control"
                                id="inputBox"
                                type="text"
                                data-role="tagsinput"
                                name="Label"
                                defaultValue="Tag1"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Source <span className="text-danger">*</span>
                              </label>
                              <select className="select2">
                                <option>Choose</option>
                                <option selected>Phone Calls</option>
                                <option>Social Media</option>
                                <option>Referral Sites</option>
                                <option>Web Analytics</option>
                                <option>Previous Purchases</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Industry <span className="text-danger">*</span>
                              </label>
                              <select className="select">
                                <option>Choose</option>
                                <option>Retail Industry</option>
                                <option selected>Banking</option>
                                <option>Hotels</option>
                                <option>Financial Services</option>
                                <option>Insurance</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Currency <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Language <span className="text-danger">*</span>
                              </label>
                              <select className="select">
                                <option>Choose</option>
                                <option selected>English</option>
                                <option>Arabic</option>
                                <option>Chinese</option>
                                <option>Hindi</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">
                                Description{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <textarea
                                className="form-control"
                                rows={5}
                                defaultValue={""}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Basic Info */}
                  {/* Address Info */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#edit-address"
                    >
                      <span>
                        <i className="ti ti-map-pin-cog" />
                      </span>
                      Address Info
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="edit-address"
                      data-bs-parent="#list-accords"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Street Address{" "}
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="22, Ave Street"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">City </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Denver"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                State / Province{" "}
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="Colorado"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
                              <label className="col-form-label">Country</label>
                              <select className="select">
                                <option>Choose</option>
                                <option>India</option>
                                <option selected>USA</option>
                                <option>France</option>
                                <option>UK</option>
                                <option>UAE</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">Zipcode </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Address Info */}
                  {/* Social Profile */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#edit-social"
                    >
                      <span>
                        <i className="ti ti-social" />
                      </span>
                      Social Profile
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="edit-social"
                      data-bs-parent="#list-accords"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Facebook</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Skype </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Linkedin{" "}
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Twitter</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
                              <label className="col-form-label">Whatsapp</label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={1234567890}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-0">
                              <label className="col-form-label">
                                Instagram
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Social Profile */}
                  {/* Access */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#edit-access"
                    >
                      <span>
                        <i className="ti ti-accessible" />
                      </span>
                      Access
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="edit-access"
                      data-bs-parent="#list-accords"
                    >
                      <div className="content-collapse">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="radio-wrap form-wrap">
                              <label className="col-form-label">
                                Visibility
                              </label>
                              <div className="d-flex flex-wrap">
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="edit-public"
                                    name="visible"
                                  />
                                  <label htmlFor="edit-public">Public</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="edit-private"
                                    name="visible"
                                  />
                                  <label htmlFor="edit-private">Private</label>
                                </div>
                                <div
                                  className="radio-btn"
                                  data-bs-toggle="modal"
                                  data-bs-target="#access_view"
                                >
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="edit-people"
                                    name="visible"
                                  />
                                  <label htmlFor="edit-people">
                                    Select People
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="radio-wrap">
                              <label className="col-form-label">Status</label>
                              <div className="d-flex flex-wrap">
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
                                  <label htmlFor="edit-inactive">
                                    Inactive
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Access */}
                </div>
                <div className="submit-button text-end">
                  <Link to="#" className="btn btn-light">
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#create_contact"
                    className="btn btn-primary"
                  >
                    Create
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Contact */}
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
      {/* Add New View */}
      <div className="modal custom-modal fade" id="save_view" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New View</h5>
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
                  <label className="col-form-label">View Name</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="modal-btn text-end">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-danger">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add New View */}
      {/* Access */}
      <div className="modal custom-modal fade" id="access_view" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Access For</h5>
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
                <div className="form-wrap icon-form">
                  <span className="form-icon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                  />
                </div>
                <div className="access-wrap">
                  <ul>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-19.jpg"
                            alt=""
                          />
                          <Link to="#">Darlee Robertson</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-20.jpg"
                            alt=""
                          />
                          <Link to="#">Sharon Roy</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-21.jpg"
                            alt=""
                          />
                          <Link to="#">Vaughan</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-01.jpg"
                            alt=""
                          />
                          <Link to="#">Jessica</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-16.jpg"
                            alt=""
                          />
                          <Link to="#">Carol Thomas</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <ImageWithBasePath
                            src="assets/img/profiles/avatar-22.jpg"
                            alt=""
                          />
                          <Link to="#">Dawn Mercha</Link>
                        </span>
                      </label>
                    </li>
                  </ul>
                </div>
                <div className="modal-btn text-end">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Access */}
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
      <Loader/>
    </div>
  );
};

export default LeadsDashboard;
