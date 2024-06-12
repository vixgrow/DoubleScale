import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table from '../../core/common/dataTable/index';
import Select , { StylesConfig }from "react-select";
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { membershiptransaction } from '../../core/data/json/membershiptransaction';
import { customStyles } from '../../core/common/selectoption/selectoption';
import { all_routes } from '../router/all_routes';
import { TableData } from '../../core/data/interface';
import CollapseHeader from '../../core/common/collapse-header';
const route = all_routes;

interface LostReason {
  key: string;
  title: string;
  createdAt: string;
  status: string;
}

const MembershipTransaction = () => {
    const [adduser, setAdduser] = useState(false);
    const [stars, setStars] = useState<{ [key: number]: boolean }>({}); // State for star toggles

    // Initialize stars state for each row
    const initializeStarsState = () => {
        const starsState: { [key: number]: boolean } = {};
        membershiptransaction.forEach((item, index) => {
            starsState[index] = true; // Set initial state to true for each row
        });
        setStars(starsState);
    };

    // Call initializeStarsState once when the component mounts
    React.useEffect(() => {
        initializeStarsState();
    }, []);

    const handleStarToggle = (index: number) => {
        setStars(prevStars => ({
            ...prevStars,
            [index]: !prevStars[index] // Toggle star state for the given index
        }));
    };
    const togglePopup = () => {
        setAdduser(!adduser);
      };
     const data =membershiptransaction;
  const options1 = [
    { value: "Select a View", label: "Select a View" },
    { value: "Contact View List", label: "Contact View List" },
    { value: "Contact Location View", label: "Contact Location View" },
  ];
  const options2 = [
    { value: "Choose", label: "Choose" },
    { value: "Germany", label: "Germany" },
    { value: "USA", label: "USA" },
    { value: "Canada", label: "Canada" },
    { value: "India", label: "India" },
    { value: "China", label: "China" },
  ];

    const columns = [
        {
          title: '',
          dataIndex: '',
          render: (text: string, record: any, index: number) => (
          <div className={`set-star rating-select ${stars[index] ? "filled" : ""}`} onClick={() => handleStarToggle(index)}>
          <i className="fa fa-star"></i>
      </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
       sorter: (a: TableData, b: TableData) =>
        a.type.length - b.type.length,
      key: "type",
    },
    {
      title: "Amount",
      dataIndex: "amount",
       sorter: (a: TableData, b: TableData) =>
        a.amount.length - b.amount.length,
      key: "amount",
    },
    {
      title: "Date",
      dataIndex: "date",
       sorter: (a: TableData, b: TableData) =>
        a.date.length - b.date.length,
      key: "date",
    },
    {
      title: "Payment Type",
      dataIndex: "payment_type",
       sorter: (a: TableData, b: TableData) =>
        a.paymentType.length - b.paymentType.length,
      key: "payment_type",
    },
    {
      title: "Status",
      dataIndex: "status",
       sorter: (a: TableData, b: TableData) =>
        a.status.length - b.status.length,
      key: "status",
      render: (status: string) => (
        <span
          className={`badge badge-pill badge-status ${
            status === "Completed" ? "bg-success" : "bg-danger"
          }`}
        >
          {status}
        </span>
      ),
    },
  ];
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
    <>
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            <div className="row">
              <div className="col-md-12">
                {/* Page Header */}
                <div className="page-header">
                  <div className="row align-items-center">
                    <div className="col-8">
                      <h4 className="page-title">Membership Transactions</h4>
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
                              placeholder="Search Transaction"
                            />
                          </div>
                        </div>
                        <div className="col-md-7 col-sm-8">
                          <div className="export-list text-sm-end">
                            <ul>
                              <li>
                                <div className="export-dropdwon">
                                  <Link
                                    to="#"
                                    className="dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="ti ti-package-export" />
                                    Export
                                  </Link>
                                  <div className="dropdown-menu  dropdown-menu-end">
                                    <ul>
                                      <li>
                                        <Link to="#">
                                          <i className="ti ti-file-type-pdf text-danger" />
                                          Export as PDF
                                        </Link>
                                      </li>
                                      <li>
                                        <Link to="#">
                                          <i className="ti ti-file-type-xls text-green" />
                                          Export as Excel{" "}
                                        </Link>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /Search */}
                    {/* Filter */}
                    <div className="filter-section filter-flex">
                      <div className="sortby-list">
                        <ul>
                          <li>
                            <div className="sort-dropdown drop-down">
                              <Link
                                to="#"
                               
                                data-bs-target="#save_view"
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
                                  className="form-control bookingrange"
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
                                      Name
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
                                      Phone
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
                                      Email
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
                                      Location
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
                                      Created Date
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
                                      Last Activity
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
                                      Status
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
                                      Action
                                    </p>
                                    <div className="status-toggle">
                                      <input
                                        type="checkbox"
                                        id="col-contact"
                                        className="check"
                                        defaultChecked={true}
                                      />
                                      <label
                                        htmlFor="col-contact"
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
                    {/* Manage Users List */}
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
                    {/* /Manage Users List */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Page Wrapper */}
      </>
    </>
  );
};

export default MembershipTransaction;
