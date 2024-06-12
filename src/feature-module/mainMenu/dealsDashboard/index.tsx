/* eslint-disable @typescript-eslint/no-unused-vars */
import ApexCharts from "apexcharts";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DateRangePicker from "react-bootstrap-daterangepicker";
import "bootstrap-daterangepicker/daterangepicker.css";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../core/data/interface";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
import Loader from "../../../core/common/loader";
const route = all_routes;
const DealsDashboard = () => {
  const dispatch = useDispatch();

  // Deals By Stage
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) {
      const options = {
        series: [
          {
            name: "sales",
            colors: ["#FFC38F"],
            data: [
              {
                x: "Inpipeline",
                y: 400,
              },
              {
                x: "Follow Up",
                y: 130,
              },
              {
                x: "Schedule",
                y: 248,
              },
              {
                x: "Conversation",
                y: 470,
              },
              {
                x: "Won",
                y: 470,
              },
              {
                x: "Lost",
                y: 180,
              },
            ],
          },
        ],
        chart: {
          type: "bar",
          height: 275,
        },
        plotOptions: {
          bar: {
            borderRadiusApplication: "around",
            columnWidth: "40%",
          },
        },
        colors: ["#00918E"],
        xaxis: {
          type: "category",
          group: {
            style: {
              fontSize: "7px",
              fontWeight: 700,
            },
          },
        },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);

  //  Leads By Stage
  const LeadsBySatge = useRef(null);

  useEffect(() => {
    if (LeadsBySatge.current) {
      const options = {
        series: [
          {
            data: [400, 220, 448],
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
        colors: ["#FC0027"],
        xaxis: {
          categories: ["Conversation", "Follow Up", "Inpipeline"],
        },
      };

      const chart = new ApexCharts(LeadsBySatge.current, options);
      chart.render();

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);
  // Won Deals Chat
  const wonChat = useRef(null);
  useEffect(() => {
    const options = {
      series: [
        {
          data: [400, 122, 250],
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
      colors: ["#5CB85C"],
      xaxis: {
        categories: ["Conversation", "Follow Up", "Inpipeline"],
      },
    };

    if (wonChat.current) {
      const chart = new ApexCharts(wonChat.current, options);
      chart.render();

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);
  // Deals By Year
  const dealsByYear = useRef(null);
  useEffect(() => {
    const options = {
      series: [
        {
          name: "Deals",
          data: [10, 20, 30, 15, 22, 40, 30, 20, 30, 18, 30, 60],
        },
      ],
      chart: {
        height: 273,
        type: "area",
        zoom: {
          enabled: false,
        },
      },
      colors: ["#E41F07"],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
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
        labels: {
          formatter: (val: number) => {
            return val / 1 + "K";
          },
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
    };

    if (dealsByYear.current) {
      const chart = new ApexCharts(dealsByYear.current, options);
      chart.render();

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);

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
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const isPathWithLoader =
      location.pathname === route.dealsDashboard ||
      location.pathname === route.leadsDashboard ||
      location.pathname === route.projectDashboard

    if (isPathWithLoader) {
      // Show the loader when navigating to a new route
      setShowLoader(true);

      // Hide the loader after 2 seconds
      const timeoutId = setTimeout(() => {
        setShowLoader(false);
      }, 1000);

      return () => {
        clearTimeout(timeoutId); // Clear the timeout when component unmounts
      };
    }
  }, [location]);




  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              <div className="page-header">
                <div className="row align-items-center ">
                  <div className="col-md-4">
                    <h3 className="page-title">Deals Dashboard</h3>
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
                <div className="col-md-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Recently Created Deals
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
                                  <Link to="#" className="dropdown-item">
                                    Last 15 days
                                  </Link>
                                  <Link to="#" className="dropdown-item">
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
                          id="deals-project"
                        >
                          <thead className="thead-light">
                            <tr>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "74px" }}
                              >
                                Deal Name
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "88px" }}
                              >
                                Stage
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "72px" }}
                              >
                                Deal Value
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "73px" }}
                              >
                                Probability
                              </th>
                              <th
                                className="sorting_disabled"
                                rowSpan={1}
                                colSpan={1}
                                style={{ width: "43px" }}
                              >
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="odd">
                              <td>Collins</td>
                              <td>Conversation</td>
                              <td>$04,51,000</td>
                              <td>85%</td>
                              <td>
                                <span className="badge badge-pill  bg-danger">
                                  Lost
                                </span>
                              </td>
                            </tr>
                            <tr className="even">
                              <td>Konopelski</td>
                              <td>Pipeline</td>
                              <td>$14,51,000</td>
                              <td>56%</td>
                              <td>
                                <span className="badge badge-pill  bg-success">
                                  Won
                                </span>
                              </td>
                            </tr>
                            <tr className="odd">
                              <td>Adams</td>
                              <td>Won</td>
                              <td>$12,51,000</td>
                              <td>15%</td>
                              <td>
                                <span className="badge badge-pill  bg-success">
                                  Won
                                </span>
                              </td>
                            </tr>
                            <tr className="even">
                              <td>Schumm</td>
                              <td>Lost</td>
                              <td>$51,000</td>
                              <td>45%</td>
                              <td>
                                <span className="badge badge-pill  bg-danger">
                                  Lost
                                </span>
                              </td>
                            </tr>
                            <tr className="odd">
                              <td>Wisozk</td>
                              <td>Follow Up</td>
                              <td>$67,000</td>
                              <td>5%</td>
                              <td>
                                <span className="badge badge-pill  bg-success">
                                  Won
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Deals By Stage
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
                                  <Link to="#" className="dropdown-item">
                                    Marketing Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Sales Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Email
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Chats
                                  </Link>
                                  <Link to="#" className="dropdown-item">
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
                                  Last 30 Days
                                </Link>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <Link to="#" className="dropdown-item">
                                    Last 30 Days
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 15 Days
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 7 Days
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="deals-chart" ref={chartRef} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 d-flex">
                  <div className="card flex-fill">
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
                                  <Link to="#" className="dropdown-item">
                                    Marketing Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Sales Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Email
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Chats
                                  </Link>
                                  <Link to="#" className="dropdown-item">
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
                                  <Link to="#" className="dropdown-item">
                                    Last 3 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 6 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="last-chart" ref={LeadsBySatge} />
                    </div>
                  </div>
                </div>
                <div className="col-md-6 d-flex">
                  <div className="card flex-fill">
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
                                  <Link to="#" className="dropdown-item">
                                    Marketing Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Sales Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Email
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Chats
                                  </Link>
                                  <Link to="#" className="dropdown-item">
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
                                  <Link to="#" className="dropdown-item">
                                    Last 3 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 6 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="won-chart" ref={wonChat} />
                    </div>
                  </div>
                </div>
                <div className="col-md-12 d-flex">
                  <div className="card w-100">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>
                          <i className="ti ti-grip-vertical me-1" />
                          Deals by Year
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
                                  <Link to="#" className="dropdown-item">
                                    Marketing Pipeline
                                  </Link>
                                  <Link to="#" className="dropdown-item">
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
                                  <Link to="#" className="dropdown-item">
                                    Last 3 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 6 months
                                  </Link>
                                  <Link to="#" className="dropdown-item">
                                    Last 12 months
                                  </Link>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div id="deals-year" ref={dealsByYear} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      <Loader/>
    </>
  );
};

export default DealsDashboard;
