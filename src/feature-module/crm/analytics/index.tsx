import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ApexCharts from "apexcharts";
import Select, { StylesConfig } from "react-select";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useDispatch, useSelector } from "react-redux";
import { setActivityTogglePopup } from "../../../core/data/redux/commonSlice";
import CollapseHeader from "../../../core/common/collapse-header";
import { SelectWithImage2 } from "../../../core/common/selectWithImage2";
import { TimePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

const Analytics = () => {
  dayjs.extend(customParseFormat);
  const onChange = (time: Dayjs, timeString: any) => {
    console.log(time, timeString);
  };

  const route = all_routes;
  const dispatch = useDispatch();
  const activityToggle = useSelector(
    (state: any) => state?.activityTogglePopup
  );

  const recentContact = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact1 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact2 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact3 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact4 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact5 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const recentContact6 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "last_6_months", label: "Last 6 months" },
  ];
  const lostdealchat = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_15_months", label: "Last 15 days" },
    { value: "last_7_months", label: "Last 7 days" },
  ];
  const lostdealchat1 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_15_months", label: "Last 15 days" },
    { value: "last_7_months", label: "Last 7 days" },
  ];
  const lostdealchat2 = [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_15_months", label: "Last 15 days" },
    { value: "last_7_months", label: "Last 7 days" },
  ];
  const pipelinelist = [
    { value: "Marketing Pipeline", label: "Marketing Pipeline" },
    { value: "Pipeline", label: "Pipeline" },
  ];
  const pipelinelist1 = [
    { value: "Marketing Pipeline", label: "Marketing Pipeline" },
    { value: "Pipeline", label: "Pipeline" },
  ];
  const pipelinelist2 = [
    { value: "Marketing Pipeline", label: "Marketing Pipeline" },
    { value: "Pipeline", label: "Pipeline" },
  ];
  const pipelinelist3 = [
    { value: "Marketing Pipeline", label: "Marketing Pipeline" },
    { value: "Pipeline", label: "Pipeline" },
  ];
  const pipelinelist4 = [
    { value: "Marketing Pipeline", label: "Marketing Pipeline" },
    { value: "Pipeline", label: "Pipeline" },
  ];
  const status = [
    { value: "Inprogress", label: "Inprogress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  const status1 = [
    { value: "Inprogress", label: "Inprogress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  const status4 = [
    { value: "Inprogress", label: "Inprogress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  const status3 = [
    { value: "Inprogress", label: "Inprogress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

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
  const leadschat = useRef(null);

  useEffect(() => {
    if (leadschat.current) {
      const options = {
        series: [
          {
            name: "sales",
            colors: ["#BEA4F2"],
            data: [
              {
                x: "Inpipeline",
                y: 400,
              },
              {
                x: "Follow Up",
                y: 30,
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
          height: 250,
        },
        plotOptions: {
          bar: {
            columnWidth: "30%",
            borderRadiusApplication: "around",
          },
        },
        colors: ["#00918E"],
      };

      const chartInstance = new ApexCharts(leadschat.current, options);
      chartInstance.render();

      return () => {
        chartInstance.destroy();
      };
    }
  }, []);

  //  Leads By Stage
  const LeadsBySatge2 = useRef(null);

  useEffect(() => {
    if (LeadsBySatge2.current) {
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

      const chart = new ApexCharts(LeadsBySatge2.current, options);
      chart.render();

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);
  const customStyles: StylesConfig = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#E41F07" : "#fff",
      color: state.isFocused ? "#fff" : "#000",
      "&:hover": {
        backgroundColor: "#E41F07",
      },
    }),
  };
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              {/* Page Header */}
              <div className="page-header">
                <div className="row align-items-center">
                  <div className="col-4">
                    <h4 className="page-title">Analytics</h4>
                  </div>
                  <div className="col-8 text-end">
                    <div className="head-icons">
                      <CollapseHeader />
                    </div>
                  </div>
                </div>
              </div>
              {/* /Page Header */}
            </div>
          </div>
          <div className="row">
            <div className="col-xl-6">
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" /> Recently Created
                    Contacts
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={recentContact}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="">
                    <div
                      id="analytic-contact_wrapper"
                      className="dataTables_wrapper dt-bootstrap5 no-footer"
                    >
                      <div className="row">
                        <div className="col-sm-12 col-md-6" />
                        <div className="col-sm-12 col-md-6" />
                      </div>
                      <div className="row dt-row">
                        <div className="col-sm-12 table-responsive">
                          <table
                            className="table dataTable custom-table mb-0 no-footer"
                            id="analytic-contact"
                            style={{ width: 635 }}
                          >
                            <thead>
                              <tr>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "174.333px" }}
                                >
                                  Contact
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 131 }}
                                >
                                  Email
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 96 }}
                                >
                                  Phone
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "152.333px" }}
                                >
                                  Created at
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-16.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Carol Thomas<span>UI /UX Designer </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>caroo3@example.com</td>
                                <td>+1 124547845</td>
                                <td>25 Sep 2023, 12:12 pm</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-22.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Dawn Mercha<span>Technician </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>dercha@example.com</td>
                                <td>+1 478845447</td>
                                <td>27 Sep 2023, 11:23 pm</td>
                              </tr>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-23.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Rachel Hampton
                                      <span>Software developer </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>rael@example.com</td>
                                <td>+1 215544845</td>
                                <td>04 Oct 2023, 04:12 pm</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-24.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Jonelle Curtiss<span>Supervisor </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>joe@example.com</td>
                                <td>+1 124547845</td>
                                <td>17 Oct 2023, 11:34 am</td>
                              </tr>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-23.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Rachel Hampton
                                      <span>Software developer </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>rael@example.com</td>
                                <td>+1 215544845</td>
                                <td>04 Oct 2023, 04:12 pm</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.contactDetails}
                                      className="avatar"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/profiles/avatar-20.jpg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.contactDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      sharon Roy<span>Installer </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>sharon@example.com</td>
                                <td>+1 466701256</td>
                                <td>15 Nov 2023, 07:26 pm</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-12 col-md-5" />
                        <div className="col-sm-12 col-md-7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between card-selectsview flex-wrap">
                  <h3 className="card-title">
                    <i className="ti ti-grip-vertical" />
                    Won Deals Stage
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={pipelinelist}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Select
                          className="select"
                          options={recentContact1}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pt-0">
                  <div id="won-chart" ref={wonChat} />
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Recently Created Deals
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={recentContact2}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <div
                      id="analytic-deal_wrapper"
                      className="dataTables_wrapper dt-bootstrap5 no-footer"
                    >
                      <div className="row">
                        <div className="col-sm-12 col-md-6" />
                        <div className="col-sm-12 col-md-6" />
                      </div>
                      <div className="row dt-row">
                        <div className="col-sm-12 table-responsive">
                          <table
                            className="table table-nowrap custom-table mb-0 dataTable no-footer"
                            id="analytic-deal"
                            style={{ width: 487 }}
                          >
                            <thead>
                              <tr>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "76.3333px" }}
                                >
                                  Deal Name
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 92 }}
                                >
                                  Stage
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 76 }}
                                >
                                  Deal Value
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 73 }}
                                >
                                  Probability
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "68.3333px" }}
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
                                  <span className="badge badge-pill badge-status bg-success">
                                    {" "}
                                    Won
                                  </span>
                                </td>
                              </tr>
                              <tr className="even">
                                <td>Konopelski</td>
                                <td>Pipeline</td>
                                <td>$04,14,800</td>
                                <td>15%</td>
                                <td>
                                  <span className="badge badge-pill badge-status bg-danger">
                                    {" "}
                                    Lost
                                  </span>
                                </td>
                              </tr>
                              <tr className="odd">
                                <td>Adams</td>
                                <td>Won</td>
                                <td>$04,14,800</td>
                                <td>95%</td>
                                <td>
                                  <span className="badge badge-pill badge-status bg-success">
                                    {" "}
                                    Won
                                  </span>
                                </td>
                              </tr>
                              <tr className="even">
                                <td>Schumm</td>
                                <td>Lost</td>
                                <td>$9,14,400</td>
                                <td>47%</td>
                                <td>
                                  <span className="badge badge-pill badge-status bg-success">
                                    {" "}
                                    Won
                                  </span>
                                </td>
                              </tr>
                              <tr className="odd">
                                <td>Wisozk</td>
                                <td>Follow Up</td>
                                <td>$11,14,400</td>
                                <td>98%</td>
                                <td>
                                  <span className="badge badge-pill badge-status bg-success">
                                    {" "}
                                    Won
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-12 col-md-5" />
                        <div className="col-sm-12 col-md-7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between card-selectsview flex-wrap">
                  <h3 className="card-title">
                    <i className="ti ti-grip-vertical" />
                    Lost Leads Stage
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={pipelinelist1}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Select
                          className="select"
                          options={lostdealchat}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pt-0">
                  <div id="last-chart-2" ref={LeadsBySatge2} />
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Leads By Stage
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={pipelinelist2}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li className="form-wrap mb-0">
                        <Select
                          className="select"
                          options={recentContact3}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div id="leads-chart" ref={leadschat} />
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Recently Added Companies
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={recentContact4}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Link to="#" className="btn btn-primary add-popup">
                          <i className="ti ti-square-rounded-plus" /> Add
                          Company
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="">
                    <div
                      id="analytic-company_wrapper"
                      className="dataTables_wrapper dt-bootstrap5 no-footer"
                    >
                      <div className="row">
                        <div className="col-sm-12 col-md-6" />
                        <div className="col-sm-12 col-md-6" />
                      </div>
                      <div className="row dt-row">
                        <div className="col-sm-12 table-responsive">
                          <table
                            className="table custom-table mb-0 dataTable no-footer"
                            id="analytic-company"
                            style={{ width: 629 }}
                          >
                            <thead>
                              <tr>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "168.333px" }}
                                >
                                  Company Name
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 131 }}
                                >
                                  Email
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 96 }}
                                >
                                  Phone
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "152.333px" }}
                                >
                                  Created at
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-03.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.companyDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      NovaWaveLLC
                                    </Link>
                                  </h2>
                                </td>
                                <td>caroo3@example.com</td>
                                <td>+1 124547845</td>
                                <td>25 Sep 2023, 12:12 pm</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-03.svg"
                                        alt="img"
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
                                <td>dercha@example.com</td>
                                <td>+1 478845447</td>
                                <td>27 Sep 2023, 11:23 pm</td>
                              </tr>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-04.svg"
                                        alt="img"
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
                                <td>rael@example.com</td>
                                <td>+1 215544845</td>
                                <td>04 Oct 2023, 04:12 pm</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-05.svg"
                                        alt="img"
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
                                <td>joe@example.com</td>
                                <td>+1 124547845</td>
                                <td>17 Oct 2023, 11:34 am</td>
                              </tr>
                              <tr className="odd">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-07.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.companyDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      CoastalStar Co.
                                    </Link>
                                  </h2>
                                </td>
                                <td>joe@example.com</td>
                                <td>+1 124547845</td>
                                <td>17 Oct 2023, 11:34 am</td>
                              </tr>
                              <tr className="even">
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.companyDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-10.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.companyDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Redwood Inc
                                    </Link>
                                  </h2>
                                </td>
                                <td>sharon@example.com</td>
                                <td>+1 466701256</td>
                                <td>15 Nov 2023, 07:26 pm</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-12 col-md-5" />
                        <div className="col-sm-12 col-md-7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Deals By Stage
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={pipelinelist3}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li className="form-wrap mb-0">
                        <Select
                          className="select"
                          options={recentContact5}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div id="deals-chart" ref={chartRef} />
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Activities
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={recentContact6}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="btn btn-primary add-popups"
                          onClick={() =>
                            dispatch(setActivityTogglePopup(!activityToggle))
                          }
                        >
                          <i className="ti ti-square-rounded-plus" /> Add New
                          Activity
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="activities-list">
                    <ul>
                      <li>
                        <div className="row align-items-center">
                          <div className="col-md-5">
                            <div className="activity-name">
                              <h5>We scheduled a meeting for next week</h5>
                              <p>Due Date : 10 Feb 2024, 09:00 am </p>
                              <span className="badge activity-badge bg-purple">
                                <i className="ti ti-user-share" />
                                Meeting
                              </span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="user-activity">
                              <span>
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-19.jpg"
                                  alt=""
                                />
                              </span>
                              <h6>Darlee Robertson</h6>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap mb-0">
                              <Select
                                className="select"
                                options={status}
                                placeholder="Inprogress"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="row align-items-center">
                          <div className="col-md-5">
                            <div className="activity-name">
                              <h5>Regarding latest updates in project </h5>
                              <p>Due date : 29 Sep 2023, 08:20 am</p>
                              <span className="badge activity-badge bg-warning">
                                <i className="ti ti-mail" />
                                Email
                              </span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="user-activity">
                              <span>
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-22.jpg"
                                  alt=""
                                />
                              </span>
                              <h6>Dawn Mercha</h6>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap mb-0">
                              <Select
                                className="select"
                                options={status1}
                                placeholder="Inprogress"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="row align-items-center">
                          <div className="col-md-5">
                            <div className="activity-name">
                              <h5>Call John and discuss about project</h5>
                              <p>Due date : 05 Oct 2023, 10:35 am</p>
                              <span className="badge activity-badge bg-blue">
                                <i className="ti ti-subtask" />
                                Task
                              </span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="user-activity">
                              <span>
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt=""
                                />
                              </span>
                              <h6>Carol Thomas</h6>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap mb-0">
                              <Select
                                className="select"
                                options={status3}
                                placeholder="Inprogress"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="row align-items-center">
                          <div className="col-md-5">
                            <div className="activity-name">
                              <h5>Discussed budget proposal with Edwin</h5>
                              <p>Due date : 16 Oct 2023, 04:40 pm</p>
                              <span className="badge activity-badge bg-green">
                                <i className="ti ti-phone" />
                                Calls
                              </span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="user-activity">
                              <span>
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-20.jpg"
                                  alt=""
                                />
                              </span>
                              <h6>Sharon Roy</h6>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-wrap mb-0">
                              <Select
                                className="select"
                                options={status4}
                                placeholder="Inprogress"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between card-selectsview flex-wrap">
                  <h3 className="card-title">
                    <i className="ti ti-grip-vertical" />
                    Lost Leads Stage
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={pipelinelist4}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Select
                          className="select"
                          options={lostdealchat1}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pt-0">
                  <div id="last-chart" ref={LeadsBySatge} />
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                  <h3>
                    <i className="ti ti-grip-vertical" />
                    Recently Created Leads
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={recentContact6}
                          placeholder="Last 30 days"
                          styles={customStyles}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="">
                    <div
                      id="analytic-lead_wrapper"
                      className="dataTables_wrapper dt-bootstrap5 no-footer"
                    >
                      <div className="row">
                        <div className="col-sm-12 col-md-6" />
                        <div className="col-sm-12 col-md-6" />
                      </div>
                      <div className="row dt-row">
                        <div className="col-sm-12 table-responsive">
                          <table
                            className="table custom-table mb-0 dataTable no-footer"
                            id="analytic-lead"
                            style={{ width: 521 }}
                          >
                            <thead>
                              <tr>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "76.3333px" }}
                                >
                                  Lead Name
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 168 }}
                                >
                                  Company Name
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: 96 }}
                                >
                                  Phone
                                </th>
                                <th
                                  className="sorting_disabled"
                                  rowSpan={1}
                                  colSpan={1}
                                  style={{ width: "99.3333px" }}
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
                                      to={route.leadsDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-01.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.leadsDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      NovaWaveLLC<span>Newyork, USA </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>+1 875455453</td>
                                <td>
                                  <span className="badge badge-pill text-white bg-success">
                                    {" "}
                                    Closed
                                  </span>
                                </td>
                              </tr>
                              <tr className="even">
                                <td>Collins</td>
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.leadsDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-02.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.leadsDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      Konopelski<span>Winchester, KY </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>+1 989757485</td>
                                <td>
                                  <span className="badge badge-pill text-white bg-pending">
                                    {" "}
                                    Not Contacted
                                  </span>
                                </td>
                              </tr>
                              <tr className="odd">
                                <td>Adams</td>
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.leadsDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-03.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.leadsDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      SilverHawk<span>Jametown, NY </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>+1 546555455</td>
                                <td>
                                  <span className="badge badge-pill text-white bg-success">
                                    {" "}
                                    Closed
                                  </span>
                                </td>
                              </tr>
                              <tr className="even">
                                <td>Schumm</td>
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.leadsDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-04.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.leadsDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      SummitPeak<span>Compton, RI </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>+1 454478787</td>
                                <td>
                                  <span className="badge badge-pill text-white bg-warning">
                                    {" "}
                                    Contacted
                                  </span>
                                </td>
                              </tr>
                              <tr className="odd">
                                <td>Wisozk</td>
                                <td>
                                  <h2 className="table-avatar d-flex align-items-center">
                                    <Link
                                      to={route.leadsDetails}
                                      className="company-img"
                                    >
                                      <ImageWithBasePath
                                        className="avatar-img"
                                        src="assets/img/icons/company-icon-05.svg"
                                        alt="img"
                                      />
                                    </Link>
                                    <Link
                                      to={route.leadsDetails}
                                      className="profile-split d-flex flex-column"
                                    >
                                      RiverStone Ventur<span>Dayton, OH </span>
                                    </Link>
                                  </h2>
                                </td>
                                <td>+1 124547845</td>
                                <td>
                                  <span className="badge badge-pill text-white bg-success">
                                    {" "}
                                    Closed
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-12 col-md-5" />
                        <div className="col-sm-12 col-md-7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card analytics-card">
                <div className="card-header d-flex justify-content-between card-selectsview flex-wrap">
                  <h3 className="card-title">
                    <i className="ti ti-grip-vertical" />
                    Recently Created Campaign
                  </h3>
                  <div className="card-select">
                    <ul>
                      <li>
                        <Select
                          className="select"
                          options={lostdealchat2}
                          placeholder="Marketing Pipeline"
                          styles={customStyles}
                        />
                      </li>
                      <li>
                        <Link to="#" className="btn btn-primary edit-popup">
                          <i className="ti ti-square-rounded-plus" /> Add
                          Pipeline
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pt-0">
                  <div className="campaign-card">
                    <ul>
                      <li className="campaign-wrap">
                        <div className="campaign-info">
                          <div className="campaign-name">
                            <h5>Distribution</h5>
                            <p>Public Relations</p>
                          </div>
                          <ul className="list-progress">
                            <li>
                              <h6>30.5%</h6>
                              <p>Opened</p>
                            </li>
                            <li>
                              <h6>20.5%</h6>
                              <p>Closed</p>
                            </li>
                            <li>
                              <h6>30.5%</h6>
                              <p>Unsubscribe</p>
                            </li>
                            <li>
                              <h6>70.5%</h6>
                              <p>Delivered</p>
                            </li>
                            <li>
                              <h6>35.0%</h6>
                              <p>Conversation</p>
                            </li>
                          </ul>
                        </div>
                        <div className="campaign-action">
                          <div className="campaign-date">
                            <span className="badge badge-pill badge-status bg-danger">
                              Bounced
                            </span>
                            <p>Due Date : 25 Sep 2023</p>
                          </div>
                          <ul className="project-mem">
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-14.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li className="more-set">
                              <Link to="#">+03</Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="campaign-wrap">
                        <div className="campaign-info">
                          <div className="campaign-name">
                            <h5>Pricing</h5>
                            <p>Social Marketing</p>
                          </div>
                          <ul className="list-progress">
                            <li>
                              <h6>42.5%</h6>
                              <p>Opened</p>
                            </li>
                            <li>
                              <h6>38.2%</h6>
                              <p>Closed</p>
                            </li>
                            <li>
                              <h6>48.8%</h6>
                              <p>Unsubscribe</p>
                            </li>
                            <li>
                              <h6>62.7%</h6>
                              <p>Delivered</p>
                            </li>
                            <li>
                              <h6>22.5%</h6>
                              <p>Conversation</p>
                            </li>
                          </ul>
                        </div>
                        <div className="campaign-action">
                          <div className="campaign-date">
                            <span className="badge badge-pill badge-status bg-green">
                              Running
                            </span>
                            <p>Due Date : 14 Oct 2023</p>
                          </div>
                          <ul className="project-mem">
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-14.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li className="more-set">
                              <Link to="#">+04</Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="campaign-wrap">
                        <div className="campaign-info">
                          <div className="campaign-name">
                            <h5>Merchandising</h5>
                            <p>Content Marketing</p>
                          </div>
                          <ul className="list-progress">
                            <li>
                              <h6>52.5%</h6>
                              <p>Opened</p>
                            </li>
                            <li>
                              <h6>29.3%</h6>
                              <p>Closed</p>
                            </li>
                            <li>
                              <h6>62.8%</h6>
                              <p>Unsubscribe</p>
                            </li>
                            <li>
                              <h6>71.3%</h6>
                              <p>Delivered</p>
                            </li>
                            <li>
                              <h6>39.5%</h6>
                              <p>Conversation</p>
                            </li>
                          </ul>
                        </div>
                        <div className="campaign-action">
                          <div className="campaign-date">
                            <span className="badge badge-pill badge-status bg-info">
                              Paused
                            </span>
                            <p>Due Date : 14 Oct 2023</p>
                          </div>
                          <ul className="project-mem">
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-14.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li className="more-set">
                              <Link to="#">+06</Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="campaign-wrap">
                        <div className="campaign-info">
                          <div className="campaign-name">
                            <h5>Repeat Customers</h5>
                            <p>Rebranding</p>
                          </div>
                          <ul className="list-progress">
                            <li>
                              <h6>17.5%</h6>
                              <p>Opened</p>
                            </li>
                            <li>
                              <h6>49.5%</h6>
                              <p>Closed</p>
                            </li>
                            <li>
                              <h6>35.2%</h6>
                              <p>Unsubscribe</p>
                            </li>
                            <li>
                              <h6>54.8%</h6>
                              <p>Delivered</p>
                            </li>
                            <li>
                              <h6>60.5%</h6>
                              <p>Conversation</p>
                            </li>
                          </ul>
                        </div>
                        <div className="campaign-action">
                          <div className="campaign-date">
                            <span className="badge badge-pill badge-status bg-success">
                              Success
                            </span>
                            <p>Due Date : 29 Oct 2023</p>
                          </div>
                          <ul className="project-mem">
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-14.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt="img"
                                />
                              </Link>
                            </li>
                            <li className="more-set">
                              <Link to="#">+02</Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add New Activity */}
      <div
        className={
          activityToggle ? "toggle-popup sidebar-popup" : "toggle-popup"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Activity</h4>
            <Link
              to="#"
              className="sidebar-close toggle-btn"
              onClick={() => dispatch(setActivityTogglePopup(!activityToggle))}
            >
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
                        Title <span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Activity Type <span className="text-danger">*</span>
                      </label>
                      <ul className="radio-activity">
                        <li>
                          <div className="active-type">
                            <input
                              type="radio"
                              id="call"
                              name="status"
                              defaultChecked={true}
                            />
                            <label htmlFor="call">
                              <i className="ti ti-phone" />
                              Calls
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="active-type">
                            <input type="radio" id="mail" name="status" />
                            <label htmlFor="mail">
                              <i className="ti ti-mail" />
                              Email
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="active-type">
                            <input type="radio" id="task" name="status" />
                            <label htmlFor="task">
                              <i className="ti ti-subtask" />
                              Task
                            </label>
                          </div>
                        </li>
                        <li>
                          <div className="active-type">
                            <input type="radio" id="shares" name="status" />
                            <label htmlFor="shares">
                              <i className="ti ti-user-share" />
                              Meeting
                            </label>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="col-form-label">
                      Due Date <span className="text-danger">*</span>
                    </label>
                    <div className="form-wrap icon-form">
                      <span className="form-icon">
                        <i className="ti ti-calendar-check" />
                      </span>
                      <input
                        type="text"
                        className="form-control datetimepicker"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="col-form-label">
                      Time <span className="text-danger">*</span>
                    </label>
                    <div className="form-wrap icon-form">
                      <span className="form-icon">
                        <i className="ti ti-clock-hour-10" />
                      </span>
                      <TimePicker
                        placeholder="Select Time"
                        className="form-control datetimepicker-time"
                        onChange={onChange}
                        defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="col-form-label">
                      Reminder <span className="text-danger">*</span>
                    </label>
                    <div className="form-wrap icon-form">
                      <span className="form-icon">
                        <i className="ti ti-bell-ringing" />
                      </span>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <div className="form-wrap w-100">
                        <label className="col-form-label">&nbsp;</label>
                        <select className="select">
                          <option>Select</option>
                          <option>Minutes</option>
                          <option>Hours</option>
                        </select>
                      </div>
                      <div className="form-wrap time-text">
                        <label className="col-form-label">&nbsp;</label>
                        <p>Before Due</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Owner <span className="text-danger">*</span>
                      </label>
                      <select className="select">
                        <option>Select</option>
                        <option>Hendry</option>
                        <option>Bradtke</option>
                        <option>Sally</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Guests <span className="text-danger">*</span>
                      </label>
                      <SelectWithImage2 />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <div className="summernote" />
                    </div>
                    <div className="form-wrap">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="col-form-label">Deals</label>
                        <Link
                          to="#"
                          className="label-add"
                          data-bs-toggle="modal"
                          data-bs-target="#add_deal"
                        >
                          <i className="ti ti-square-rounded-plus" />
                          Add New
                        </Link>
                      </div>
                      <select className="select">
                        <option>Select</option>
                        <option>Collins</option>
                        <option>Konopelski </option>
                        <option>Adams</option>
                      </select>
                    </div>
                    <div className="form-wrap">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="col-form-label">Contacts</label>
                        <Link
                          to="#"
                          className="label-add"
                          data-bs-toggle="modal"
                          data-bs-target="#add_contacts"
                        >
                          <i className="ti ti-square-rounded-plus" />
                          Add New
                        </Link>
                      </div>
                      <select className="select">
                        <option>Select</option>
                        <option>Collins</option>
                        <option>Konopelski </option>
                        <option>Adams</option>
                      </select>
                    </div>
                    <div className="form-wrap">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="col-form-label">Companies</label>
                        <Link
                          to="#"
                          className="label-add"
                          data-bs-toggle="modal"
                          data-bs-target="#add_company"
                        >
                          <i className="ti ti-square-rounded-plus" />
                          Add New
                        </Link>
                      </div>
                      <select className="select">
                        <option>Select</option>
                        <option>NovaWave LLC</option>
                        <option>SilverHawk</option>
                        <option>HarborView</option>
                      </select>
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
      {/* /Add New Activity */}
      {/* Edit Activity */}
      <div className="toggle-popup1">
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <div>
              <h4 className="mb-1">We scheduled a meeting for next week</h4>
              <p>Created At: September 28, 2023 01:21 - Hendry</p>
            </div>
            <Link to="#" className="sidebar-close1 toggle-btn">
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <form className="toggle-height">
              <div className="pro-create">
                <div className="tab-activity">
                  <ul className="nav">
                    <li>
                      <Link
                        to="#"
                        data-bs-toggle="tab"
                        data-bs-target="#activity"
                        className="active"
                      >
                        Activity
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        data-bs-toggle="tab"
                        data-bs-target="#comments"
                      >
                        Comments<span>1</span>
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="tab-content">
                  <div className="tab-pane fade" id="comments">
                    <div className="comment-wrap">
                      <h6>
                        The best way to get a project done faster is to start
                        sooner. A goal without a timeline is just a dream.The
                        goal you set must be challenging. At the same time, it
                        should be realistic and attainable, not impossible to
                        reach.
                      </h6>
                      <p>
                        Commented by <span>Aeron</span> on 15 Sep 2023, 11:15 pm
                      </p>
                    </div>
                  </div>
                  <div className="tab-pane show active" id="activity">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Title <span className="text-danger">*</span>
                          </label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Activity Type <span className="text-danger">*</span>
                          </label>
                          <ul className="radio-activity">
                            <li>
                              <div className="active-type">
                                <input
                                  type="radio"
                                  id="call1"
                                  name="status"
                                  defaultChecked={true}
                                />
                                <label htmlFor="call1">
                                  <i className="ti ti-phone" />
                                  Calls
                                </label>
                              </div>
                            </li>
                            <li>
                              <div className="active-type">
                                <input type="radio" id="mail1" name="status" />
                                <label htmlFor="mail1">
                                  <i className="ti ti-mail" />
                                  Email
                                </label>
                              </div>
                            </li>
                            <li>
                              <div className="active-type">
                                <input type="radio" id="task1" name="status" />
                                <label htmlFor="task1">
                                  <i className="ti ti-subtask" />
                                  Task
                                </label>
                              </div>
                            </li>
                            <li>
                              <div className="active-type">
                                <input
                                  type="radio"
                                  id="shares1"
                                  name="status"
                                />
                                <label htmlFor="shares1">
                                  <i className="ti ti-user-share" />
                                  Meeting
                                </label>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="col-form-label">
                          Due Date <span className="text-danger">*</span>
                        </label>
                        <div className="form-wrap icon-form">
                          <span className="form-icon">
                            <i className="ti ti-calendar-check" />
                          </span>
                          <input
                            type="text"
                            className="form-control datetimepicker"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="col-form-label">
                          Time <span className="text-danger">*</span>
                        </label>
                        <div className="form-wrap icon-form">
                          <span className="form-icon">
                            <i className="ti ti-clock-hour-10" />
                          </span>
                          <TimePicker
                            placeholder="Select Time"
                            className="form-control datetimepicker-time"
                            onChange={onChange}
                            defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="col-form-label">
                          Reminder <span className="text-danger">*</span>
                        </label>
                        <div className="form-wrap icon-form">
                          <span className="form-icon">
                            <i className="ti ti-bell-ringing" />
                          </span>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="form-wrap w-100">
                            <label className="col-form-label">&nbsp;</label>
                            <select className="select">
                              <option>Select</option>
                              <option>Minutes</option>
                              <option>Hours</option>
                            </select>
                          </div>
                          <div className="form-wrap time-text">
                            <label className="col-form-label">&nbsp;</label>
                            <p>Before Due</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Owner <span className="text-danger">*</span>
                          </label>
                          <select className="select">
                            <option>Select</option>
                            <option>Hendry</option>
                            <option>Bradtke</option>
                            <option>Sally</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Guests <span className="text-danger">*</span>
                          </label>
                          <SelectWithImage2 />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Description <span className="text-danger">*</span>
                          </label>
                          <div className="summernote" />
                        </div>
                        <div className="form-wrap">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="col-form-label">Deals</label>
                            <Link
                              to="#"
                              className="label-add"
                              data-bs-toggle="modal"
                              data-bs-target="#add_deal"
                            >
                              <i className="ti ti-square-rounded-plus" />
                              Add New
                            </Link>
                          </div>
                          <select className="select">
                            <option>Select</option>
                            <option>Collins</option>
                            <option>Konopelski </option>
                            <option>Adams</option>
                          </select>
                        </div>
                        <div className="form-wrap">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="col-form-label">Contacts</label>
                            <Link
                              to="#"
                              className="label-add"
                              data-bs-toggle="modal"
                              data-bs-target="#add_contacts"
                            >
                              <i className="ti ti-square-rounded-plus" />
                              Add New
                            </Link>
                          </div>
                          <select className="select">
                            <option>Select</option>
                            <option>Collins</option>
                            <option>Konopelski </option>
                            <option>Adams</option>
                          </select>
                        </div>
                        <div className="form-wrap">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="col-form-label">Companies</label>
                            <Link
                              to="#"
                              className="label-add"
                              data-bs-toggle="modal"
                              data-bs-target="#add_company"
                            >
                              <i className="ti ti-square-rounded-plus" />
                              Add New
                            </Link>
                          </div>
                          <select className="select">
                            <option>Select</option>
                            <option>NovaWave LLC</option>
                            <option>SilverHawk</option>
                            <option>HarborView</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="submit-button text-end">
                <Link to="#" className="btn btn-light sidebar-close1">
                  Cancel
                </Link>
                <Link to="#" className="btn btn-primary">
                  Save Changes
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Activity */}
      {/* Delete Activity */}
      <div
        className="modal custom-modal fade"
        id="delete_activity"
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
                <h3>Remove Activity?</h3>
                <p className="del-info">
                  Are you sure you want to remove activity you selected.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to={route.activities} className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Activity */}
      {/* Add New Pipeline */}
      <div
        className={
          activityToggle ? "toggle-popup sidebar-popup" : "toggle-popup"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Pipeline</h4>
            <Link
              to="#"
              className="sidebar-close toggle-btn"
              onClick={() => dispatch(setActivityTogglePopup(!activityToggle))}
            >
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <form className="toggle-height">
              <div className="pro-create">
                <div className="form-wrap">
                  <label className="col-form-label">
                    Pipeline Name <span className="text-danger">*</span>
                  </label>
                  <input className="form-control" type="text" />
                </div>
                <div className="form-wrap">
                  <div className="pipe-title d-flex align-items-center justify-content-between">
                    <h5 className="form-title">Pipeline Stages</h5>
                    <Link
                      to="#"
                      className="add-stage"
                      data-bs-toggle="modal"
                      data-bs-target="#add_stage"
                    >
                      <i className="ti ti-square-rounded-plus" />
                      Add New
                    </Link>
                  </div>
                  <div className="pipeline-listing">
                    <div className="pipeline-item">
                      <p>
                        <i className="ti ti-grip-vertical" /> Inpipeline
                      </p>
                      <div className="action-pipeline">
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_stage"
                        >
                          <i className="ti ti-edit text-blue" />
                          Edit
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_stage"
                        >
                          <i className="ti ti-trash text-danger" />
                          Delete
                        </Link>
                      </div>
                    </div>
                    <div className="pipeline-item">
                      <p>
                        <i className="ti ti-grip-vertical" /> Follow Up
                      </p>
                      <div className="action-pipeline">
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_stage"
                        >
                          <i className="ti ti-edit text-blue" />
                          Edit
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_stage"
                        >
                          <i className="ti ti-trash text-danger" />
                          Delete
                        </Link>
                      </div>
                    </div>
                    <div className="pipeline-item">
                      <p>
                        <i className="ti ti-grip-vertical" /> Schedule Service
                      </p>
                      <div className="action-pipeline">
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_stage"
                        >
                          <i className="ti ti-edit text-blue" />
                          Edit
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_stage"
                        >
                          <i className="ti ti-trash text-danger" />
                          Delete
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-wrap">
                  <h5 className="form-title">Access</h5>
                  <div className="d-flex flex-wrap access-item nav">
                    <div
                      className="radio-btn"
                      data-bs-toggle="tab"
                      data-bs-target="#all"
                    >
                      <input
                        type="radio"
                        className="status-radio"
                        id="all"
                        name="status"
                        defaultChecked={true}
                      />
                      <label htmlFor="all">All</label>
                    </div>
                    <div
                      className="radio-btn"
                      data-bs-toggle="tab"
                      data-bs-target="#select-person"
                    >
                      <input
                        type="radio"
                        className="status-radio"
                        id="select"
                        name="status"
                      />
                      <label htmlFor="select">Select Person</label>
                    </div>
                  </div>
                  <div className="tab-content">
                    <div className="tab-pane fade" id="select-person">
                      <div className="access-wrapper">
                        <div className="access-view">
                          <div className="access-img">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-21.jpg"
                              alt="Image"
                            />
                            Vaughan
                          </div>
                          <Link to="#">Remove</Link>
                        </div>
                        <div className="access-view">
                          <div className="access-img">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-01.jpg"
                              alt="Image"
                            />
                            Jessica
                          </div>
                          <Link to="#">Remove</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="submit-button text-end">
                <Link to="#" className="btn btn-light sidebar-close">
                  Cancel
                </Link>
                <Link to="#" className="btn btn-primary">
                  Create
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add New Pipeline */}
      {/* Delete Stage */}
      <div className="modal custom-modal fade" id="delete_stage" role="dialog">
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
                <h3>Remove Stage?</h3>
                <p className="del-info">Are you sure you want to remove it.</p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                  >
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Stage */}
      {/* Add New Stage */}
      <div className="modal custom-modal fade" id="add_stage" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Stage</h5>
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
                  <label className="col-form-label">Stage Name *</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="modal-btn text-end">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>

                  <Link
                    to="#"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                  >
                    Save Changes
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add New Stage */}
      {/* Edit Stage */}
      <div className="modal custom-modal fade" id="edit_stage" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Stage</h5>
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
                  <label className="col-form-label">Stage Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="Inpipeline"
                  />
                </div>
                <div className="modal-btn text-end">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                  >
                    Save Changes
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Stage */}
    </>
  );
};

export default Analytics;