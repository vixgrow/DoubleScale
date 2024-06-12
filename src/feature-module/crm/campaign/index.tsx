import React, { useState } from 'react'
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Link, useLocation } from 'react-router-dom'
import Select from 'react-select';
import { compaignData } from '../../../core/data/json/campaignData';
import { TableData } from '../../../core/data/interface';
import Table from '../../../core/common/dataTable/index';
import CampaignModal from '../../../core/modals/campaign_modal';
import { useDispatch, useSelector } from 'react-redux';
import { setActivityTogglePopup, setActivityTogglePopupTwo } from '../../../core/data/redux/commonSlice';
import { all_routes } from '../../router/all_routes';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import CollapseHeader from '../../../core/common/collapse-header';

const Campaign = () => {
    const route = all_routes
    const dispatch = useDispatch();
    const activityToggle = useSelector((state:any) => state?.activityTogglePopup);
    const activityToggleTwo = useSelector((state: any) => state?.activityToggleTwo);

    const location = useLocation();
    const isLinkActive = (route:string) => {
        // Check if the current location matches the given route
        return location.pathname === route;
    };
    const multiSelectOption = [
        { value: "small_business", label: "Small Business" },
        { value: "corporate_companies", label: "Corporate Companies" },
        { value: "urban_apartment", label: "Urban Apartment" },
        { value: "business", label: "Business" }
    ];

    const [isOpen, setIsOpen] = useState(false);

    const togglePopup = () => {
        setIsOpen(!isOpen);
    };

    const data = compaignData
    const filterSelect = [
        { value: 'default', label: 'Select a View' },
        { value: 'contactViewList', label: 'Contact View List' },
        { value: 'contactLocationView', label: 'Contact Location View' }
    ];
    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            sorter: (a: TableData, b: TableData) => a.name.length - b.name.length,
        },
        {
            title: "Type",
            dataIndex: "type",
            sorter: (a: TableData, b: TableData) =>
                a.type.length - b.type.length,
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            // width: 500, // Specify the width here
            render: (text: string) => {
                const progressData = text.split('\n').filter(item => item.trim() !== ''); // Split progress data by newline and filter out empty strings
                return (
                    <ul className="list-progress">
                        {progressData.map((item, index) => {
                            const [percentage, label] = item.split('%').map(str => str.trim()); // Split each item into percentage and label
                            return (
                                <li key={index}>
                                    <h6>{percentage}</h6>
                                    <p>{label}</p>
                                </li>
                            );
                        })}
                    </ul>
                );
            },
            sorter: (a: TableData, b: TableData) => a.progress.length - b.progress.length,

        },
        // {
        //     title: "Members",
        //     dataIndex: "members",
        //     sorter: (a: TableData, b: TableData) => a.members.length - b.members.length,
        // },
        {
            title: "Start Date",
            dataIndex: "startDate",
            sorter: (a: TableData, b: TableData) => a.startDate.length - b.startDate.length,
        },
        {
            title: "End Date",
            dataIndex: "endDate",
            sorter: (a: TableData, b: TableData) => a.endDate.length - b.endDate.length,
        },

        {
            title: "Status",
            dataIndex: "status",
            render: (text: string) => (
                <div>
                    {text === "Success" && (
                        <span className="badge badge-pill badge-status bg-success">{text}</span>
                    )}
                    {text === "Pending" && (
                        <span className="badge badge-pill badge-status bg-warning">{text}</span>
                    )}
                    {text === "Bounced" && (
                        <span className="badge badge-pill badge-status bg-danger">{text}</span>
                    )}
                    {text === "Paused" && (
                        <span className="badge badge-pill badge-status bg-info">{text}</span>
                    )}
                    {text === "Running" && (
                        <span className="badge badge-pill badge-status bg-green">{text}</span>
                    )}
                </div>
            ),
            sorter: true,
        },

        {
            title: "Created",
            dataIndex: "created",
            sorter: (a: TableData, b: TableData) => a.created.length - b.created.length,
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            render: () => (
                <div className="dropdown table-action">
                    <Link to="#" className="action-icon" data-bs-toggle="dropdown" aria-expanded="true">
                        <i className="fa fa-ellipsis-v"></i>
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right" style={{ position: 'absolute', inset: '0px auto auto 0px', margin: '0px', transform: 'translate3d(-99.3333px, 35.3333px, 0px)' }} data-popper-placement="bottom-start">
                        <Link className="dropdown-item edit-popup" to="#" onClick={() => dispatch(setActivityTogglePopupTwo(!activityToggleTwo))}>
                            <i className="ti ti-edit text-blue"></i> Edit
                        </Link>
                        <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_campaign">
                            <i className="ti ti-trash text-danger"></i> Delete
                        </Link>
                    </div>
                </div>
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
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    <div className="row">
                        <div className="col-md-12">
                            {/* Page Header */}
                            <div className="page-header">
                                <div className="row align-items-center">
                                    <div className="col-4">
                                        <h4 className="page-title">
                                            Campaign<span className="count-title">123</span>
                                        </h4>
                                    </div>
                                    <div className="col-8 text-end">
                                        <div className="head-icons">
                                            <CollapseHeader />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Page Header */}
                            {/* Campaign Status */}
                            <div className="row">
                                <div className="col-xl-3 col-lg-6">
                                    <div className="campaign-box bg-danger-light">
                                        <div className="campaign-img">
                                            <span>
                                                <i className="ti ti-brand-campaignmonitor" />
                                            </span>
                                            <p>Campaign</p>
                                        </div>
                                        <h2>474</h2>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6">
                                    <div className="campaign-box bg-warning-light">
                                        <div className="campaign-img">
                                            <span>
                                                <i className="ti ti-send" />
                                            </span>
                                            <p>Sent</p>
                                        </div>
                                        <h2>454</h2>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6">
                                    <div className="campaign-box bg-purple-light">
                                        <div className="campaign-img">
                                            <span>
                                                <i className="ti ti-brand-feedly" />
                                            </span>
                                            <p>Opened</p>
                                        </div>
                                        <h2>658</h2>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6">
                                    <div className="campaign-box bg-success-light">
                                        <div className="campaign-img">
                                            <span>
                                                <i className="ti ti-brand-pocket" />
                                            </span>
                                            <p>Completed</p>
                                        </div>
                                        <h2>747</h2>
                                    </div>
                                </div>
                            </div>
                            {/* /Campaign Status */}
                            {/* Campaign Tab */}
                            <div className="campaign-tab">
                                <ul className="nav">
                                    <li>
                                        <Link to={route.campaign} className={isLinkActive(route.campaign) ? "active" : ""}>
                                            Active Campaign<span>24</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={route.campaignComplete} className={isLinkActive(route.campaignComplete) ? "active" : ""}>
                                            Completed Campaign
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={route.campaignArchieve} className={isLinkActive(route.campaignArchieve) ? "active" : ""}>Archived Campaign</Link>
                                    </li>
                                </ul>
                            </div>
                            {/* Campaign Tab */}
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
                                                        placeholder="Search Campaign"
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
                                                        <li>
                                                            

                                                            <Link to="#" className="btn btn-primary add-popup" onClick={()=> dispatch(setActivityTogglePopup(!activityToggle))}><i className="ti ti-square-rounded-plus" /> Add New Campaign</Link>

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
                                                        <DateRangePicker initialSettings={initialSettings}>
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
                                                                Please drag and drop your column to reorder your
                                                                table and enable see option as you want.
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
                                                                        Type
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
                                                                        Progress
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
                                                                        Members
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
                                                                        Start Date
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
                                                                        End Date
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
                                                                        Created
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
                                                                <li>
                                                                    <p>
                                                                        <i className="ti ti-grip-vertical" />
                                                                        Action
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
                                    {/* Campaign List */}
                                    <div className="col-sm-12 table-responsive">
                                        <Table
                                            dataSource={data}
                                            columns={columns}
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
                                    {/* /Campaign List */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Delete Campaign */}
                <div className="modal custom-modal fade" id="delete_campaign" role="dialog">
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
                                    <h3>Remove Campaign??</h3>
                                    <p className="del-info">
                                        Are you sure you want to remove campaign you selected.
                                    </p>
                                    <div className="col-lg-12 text-center modal-btn">
                                        <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                                            Cancel
                                        </Link>
                                        <Link to={route.campaign} className="btn btn-danger">
                                            Yes, Delete it
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Delete Campaign */}
                {/* Add New Campaign */}
                <div className="toggle-popup">
                    <div className="sidebar-layout">
                        <div className="sidebar-header">
                            <h4>Add New Campaign</h4>
                            <Link to="#" className="sidebar-close toggle-btn">
                                <i className="ti ti-x" />
                            </Link>
                        </div>
                        <div className="toggle-body">
                            <form  className="toggle-height">
                                <div className="pro-create">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Name <span className="text-danger">*</span>
                                                </label>
                                                <input type="text" className="form-control" />
                                            </div>
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Campaign Type <span className="text-danger">*</span>
                                                </label>
                                                <select className="select2">
                                                    <option>Choose</option>
                                                    <option>Public Relations</option>
                                                    <option>Brand</option>
                                                    <option>Media</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Deal Value<span className="text-danger"> *</span>
                                                </label>
                                                <input className="form-control" type="text" />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Currency <span className="text-danger">*</span>
                                                </label>
                                                <select className="select">
                                                    <option>Select</option>
                                                    <option>$</option>
                                                    <option>€</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Period <span className="text-danger">*</span>
                                                </label>
                                                <input className="form-control" type="text" />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Period Value <span className="text-danger">*</span>
                                                </label>
                                                <input className="form-control" type="text" />
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Target Audience <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={multiSelectOption}
                                                    isMulti
                                                    defaultValue={[multiSelectOption[0], multiSelectOption[1], multiSelectOption[2]]}
                                                />
                                            </div>
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
                                            <div className="form-wrap">
                                                <label className="col-form-label">
                                                    Attachment <span className="text-danger">*</span>
                                                </label>
                                                <div className="drag-attach">
                                                    <input type="file" />
                                                    <div className="img-upload">
                                                        <i className="ti ti-file-broken" />
                                                        Upload File
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-wrap">
                                                <label className="col-form-label">Uploaded Files</label>
                                                <div className="upload-file upload-list">
                                                    <div>
                                                        <h6>tes.txt</h6>
                                                        <p>4.25 MB</p>
                                                    </div>
                                                    <Link to="#" className="text-danger">
                                                        <i className="ti ti-trash-x" />
                                                    </Link>
                                                </div>
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
                {/* /Add New Campaign */}
            </div>
            {/* /Page Wrapper */}
            <CampaignModal />
        </>

    )
}

export default Campaign
