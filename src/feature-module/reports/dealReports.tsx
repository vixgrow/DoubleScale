import React, { useState } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { DailyReportData } from "../../core/json/dealReportsData";
import DealReportModal from "../../core/modals/dealReportModal";
import DateRangePicker from "react-bootstrap-daterangepicker";
import { all_routes } from "../router/all_routes";
import Table from "../../core/common/dataTable/index";
import Reports_modal from "../../core/modals/reports_modal";
import CollapseHeader from "../../core/common/collapse-header";
import Select from "react-select";
import { customStyles, options1 } from "../../core/common/selectoption/selectoption";

const route = all_routes;

const DealReports = () => {
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
  const data = DailyReportData;

  const columns = [
    {
      title: "",

      render: () => (
        <div className="set-star rating-select">
          <i className="fa fa-star" />
        </div>
      ),
    },
    {
      title: "Deal Name",
      dataIndex: "Deal_Name",
      sorter: (a: any, b: any) => a.Deal_Name.length - b.Deal_Name.length,
    },

    {
      title: "Deal Stage",
      dataIndex: "Stage",
      sorter: (a: any, b: any) => a.Stage.length - b.Stage.length,
    },
    {
      title: "Deal Value",
      dataIndex: "Deal_Value",
      sorter: (a: any, b: any) => a.country_name.length - b.country_name.length,
    },
    {
      title: "Expexted Close Date",
      dataIndex: "close_date",
      sorter: (a: any, b: any) => a.close_date.length - b.close_date.length,
    },
    {
      title: "Owner",
      dataIndex: "owner",
      sorter: (a: any, b: any) => a.owner.length - b.owner.length,
    },
    {
      title: "Probability",
      dataIndex: "Probability",
      sorter: (a: any, b: any) => a.Probability.length - b.Probability.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any, record: any) => (
        <span
          className={`badge badge-pill badge-status ${
            record?.Status === "Won"
              ? "bg-success"
              : record?.Status === "Lost"
              ? "bg-danger"
              : "bg-purple"
          }`}
        >
          {record?.Status}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "Source",
      dataIndex: "source",
      sorter: (a: any, b: any) => a.source.length - b.source.length,
    },
    {
      title: "created_date",
      dataIndex: "created_date",
      sorter: (a: any, b: any) => a.created_date.length - b.created_date.length,
    },
  ];

  const [chartOptions, setChartOptions] = useState<any>({
    chart: {
      height: 270,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    colors: ["#5CB85C", "#FC0027"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    series: [
      {
        name: "Won Deals",
        data: [110, 85, 100, 90, 85, 105, 90, 115, 95],
      },
      {
        name: "Lost Deals",
        data: [45, 55, 50, 55, 40, 60, 55, 60, 66],
      },
    ],
    xaxis: {
      categories: [
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
      ],
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " Deals";
        },
      },
    },
  });

  const [chartConfig, setChartConfig] = useState<any>({
    series: [44, 55, 41, 17],
    chart: {
      type: "donut",
    },
    colors: ["#0092E4", "#4A00E5", "#E41F07", "#FFA201"],
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
    legend: {
      position: "bottom",
      formatter: function (val: string, opts: any) {
        return val + " - " + opts.w.globals.series[opts.seriesIndex];
      },
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            {/* Page Header */}
            <div className="page-header">
              <div className="row align-items-center">
                <div className="col-8">
                  <h4 className="page-title">
                    Deals <span className="count-title">123</span>
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
                          placeholder="Search Deals"
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
                  <div className="col-md-7">
                    <div className="card report-card">
                      <div className="card-body">
                        <div className="statistic-header report-header">
                          <h4>Deals by Year</h4>
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
                        {/* <div id="deals-report" /> */}

                        <Chart
                          options={chartOptions}
                          series={chartOptions.series}
                          type="bar"
                          height={270}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5 d-flex">
                    <div className="card report-card w-100">
                      <div className="card-body">
                        <div className="statistic-header report-header">
                          <h4>Deals by Source</h4>
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
                        {/* <div id="deals-analysis" /> */}

                        <Chart
                          options={chartConfig}
                          series={chartConfig.series}
                          type="donut"
                        />
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
                              <div className="dropdown-menu  dropdown-menu-xl-end">
                                <h4>Want to manage datatables?</h4>
                                <p>
                                  Please drag and drop your column to reorder
                                  your table and enable see option as you want.
                                </p>
                                <ul>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Deal Name
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
                                      Stage
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
                                      Deal Value
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
                                      Tags
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
                                      Expected Closed Date
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
                                      Rating
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
                                      Owner
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
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Probability
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-contact"
                                        className="check"
                                        defaultChecked
                                      />
                                      <label
                                        htmlFor="col-contact"
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
                                        id="col-status"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-status"
                                        className="checktoggle"
                                      />
                                    </div>
                                  </li>
                                  <li>
                                    <p>
                                      <i className="ti ti-grip-vertical" />
                                      Source
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-action"
                                        className="check"
                                      />
                                      <label
                                        htmlFor="col-action"
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
                              <div className="filter-dropdown-menu dropdown-menu  dropdown-menu-xl-end">
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
                      <Table columns={columns} dataSource={data} />
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

export default DealReports;
