import React, { useState } from "react";
import { companiesData } from "../../../core/json/companiesData";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import DateRangePicker from "react-bootstrap-daterangepicker";
import { all_routes } from "../../router/all_routes";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivityTogglePopup,
  setActivityTogglePopupTwo,
  setAddTogglePopupTwo,
} from "../../../core/data/redux/commonSlice";
import { TagsInput } from "react-tag-input-component";
import Select from "react-select";
import {
  customStyles,
  duration,
  options1,
  optionssymbol,
  priorityList,
  project,
  salestypelist,
  socialMedia,
  status,
  tagInputValues,
} from "../../../core/common/selectoption/selectoption";
import DatePicker from "react-datepicker";
import DefaultEditor from "react-simple-wysiwyg";
import CollapseHeader from "../../../core/common/collapse-header";
import Table from "../../../core/common/dataTable/index";
import { SelectWithImage2 } from "../../../core/common/selectWithImage2";

const Companies = () => {
  const addTogglePopupTwo = useSelector(
    (state: any) => state?.addTogglePopupTwo
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };
  const [selectedDate1, setSelectedDate1] = useState<Date | null>(new Date());
  const handleDateChange1 = (date: Date | null) => {
    setSelectedDate1(date);
  };

  const [owner, setOwner] = useState([
    { value: "Carol Thomas", label: "Carol Thomas" },
    { value: "Vaughan", label: "Vaughan" },
    { value: "Sharon Roy", label: "Sharon Roy" },
    { value: "Jerald", label: "Jerald" },
  ]);
  const dealsopen = [
    { value: "choose", label: "Choose" },
    { value: "collins", label: "Collins" },
    { value: "konopelski", label: "Konopelski" },
    { value: "adams", label: "Adams" },
    { value: "schumm", label: "Schumm" },
    { value: "wisozk", label: "Wisozk" },
  ];
  const activities = [
    { value: "choose", label: "Choose" },
    { value: "phoneCalls", label: "Phone Calls" },
    { value: "socialMedia", label: "Social Media" },
    { value: "referralSites", label: "Referral Sites" },
    { value: "webAnalytics", label: "Web Analytics" },
    { value: "previousPurchases", label: "Previous Purchases" },
  ];
  const industries = [
    { value: "choose", label: "Choose" },
    { value: "Retail Industry", label: "Retail Industry" },
    { value: "Banking", label: "Banking" },
    { value: "Hotels", label: "Hotels" },
    { value: "Financial Services", label: "Financial Services" },
    { value: "Insurance", label: "Insurance" },
  ];
  const languages = [
    { value: "Choose", label: "Choose" },
    { value: "English", label: "English" },
    { value: "Arabic", label: "Arabic" },
    { value: "Chinese", label: "Chinese" },
    { value: "Hindi", label: "Hindi" },
  ];
  const countries = [
    { value: "Choose", label: "Choose" },
    { value: "India", label: "India" },
    { value: "USA", label: "USA" },
    { value: "France", label: "France" },
    { value: "UAE", label: "UAE" },
  ];

  const ownerLabels = owner.map((item) => item.label);

  const dispatch = useDispatch();

  const activityToggle = useSelector(
    (state: any) => state?.activityTogglePopup
  );
  const activityToggleTwo = useSelector(
    (state: any) => state?.activityTogglePopupTwo
  );

  const data = companiesData;
  const route = all_routes;
  const [stars, setStars] = useState<{ [key: number]: boolean }>({}); // State for star toggles

  // Initialize stars state for each row
  const initializeStarsState = () => {
    const starsState: { [key: number]: boolean } = {};
    companiesData.forEach((item, index) => {
      starsState[index] = true; // Set initial state to true for each row
    });
    setStars(starsState);
  };

  // Call initializeStarsState once when the component mounts
  React.useEffect(() => {
    initializeStarsState();
  }, []);

  const handleStarToggle = (index: number) => {
    setStars((prevStars) => ({
      ...prevStars,
      [index]: !prevStars[index], // Toggle star state for the given index
    }));
  };
  const columns = [
    {
      title: "",
      dataIndex: "",
      render: (text: string, record: any, index: number) => (
        <div
          className={`set-star rating-select ${stars[index] ? "filled" : ""}`}
          onClick={() => handleStarToggle(index)}
        >
          <i className="fa fa-star"></i>
        </div>
      ),
    },

    {
      title: "Name",
      dataIndex: "name",
      render: (text: any, record: any) => (
        <div className="table-avatar d-flex align-items-center table-padding">
          <Link to={route.companyDetails} className="company-img">
            <ImageWithBasePath src={record.image} alt="UserImage" />
          </Link>
          <Link to={route.companyDetails} className="profile-split">
            {record.name}
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.name.length - b.name.length,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a: any, b: any) => a.phone.length - b.phone.length,
    },

    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: any, b: any) => a.email.length - b.email.length,
    },

    {
      title: "Tags",
      dataIndex: "tags",
      render: (text: any, record: any) => (
        <span
          className={
            text === "Promotion"
              ? "badge badge-tag badge-purple-light"
              : "badge badge-tag badge-warning-light"
          }
        >
          {text}
        </span>
      ),

      sorter: (a: any, b: any) => a.tags.length - b.tags.length,
    },
    {
      title: "Location",
      dataIndex: "location",
      sorter: (a: any, b: any) => a.location.length - b.location.length,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      render: (text: any, record: any) => (
        <div className="set-star">
          <i className="fa fa-star filled me-2" />
          {text}
        </div>
      ),
      sorter: (a: any, b: any) => a.rating.length - b.rating.length,
    },
    {
      title: "Owner",
      dataIndex: "owner",
      sorter: (a: any, b: any) => a.owner.length - b.owner.length,
    },

    {
      title: "Contact",
      dataIndex: "Contact",
      render: () => (
        <ul className="social-links d-flex align-items-center">
          <li>
            <Link to="#">
              <i className="ti ti-mail" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="ti ti-phone-check" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="ti ti-message-circle-share" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="ti ti-brand-skype" />
            </Link>
          </li>
          <li>
            <Link to="#">
              <i className="ti ti-brand-facebook " />
            </Link>
          </li>
        </ul>
      ),

      sorter: (a: any, b: any) => a.owner.length - b.owner.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: any, record: any) => (
        <div className="dropdown action-label">
          <Link
            to="#"
            className={
              text === "Inactive"
                ? "btn btn-white btn-sm badge-outline-danger status-color-dg"
                : "btn btn-white btn-sm badge-outline-success status-color"
            }
          >
            {text}
          </Link>
        </div>
      ),

      sorter: (a: any, b: any) => a.owner.length - b.owner.length,
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
              onClick={() =>
                dispatch(setActivityTogglePopupTwo(!activityToggleTwo))
              }
            >
              <i className="ti ti-edit text-blue" /> Edit
            </Link>
            <Link
              className="dropdown-item"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#delete_contact"
            >
              <i className="ti ti-trash text-danger" /> Delete
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
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              {/* Page Header */}
              <div className="page-header">
                <div className="row align-items-center">
                  <div className="col-8">
                    <h4 className="page-title">
                      Companies<span className="count-title">123</span>
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
                            placeholder="Search Companies"
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
                                        Export as Excel
                                      </Link>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="btn btn-primary add-popup"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopup(!activityToggle)
                                  )
                                }
                              >
                                <i className="ti ti-square-rounded-plus" />
                                Add Company
                              </Link>
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
                              Sort
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
                                    Location
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
                                    Contact
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
                        <li>
                          <div className="view-icons">
                            <Link to={route.companies} className="active">
                              <i className="ti ti-list-tree" />
                            </Link>
                            <Link to={route.companiesGrid}>
                              <i className="ti ti-grid-dots" />
                            </Link>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* /Filter */}
                  {/* Contact List */}
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
                  {/* /Contact List */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                <h3>Remove Companies?</h3>
                <p className="del-info">
                  Company ”NovaWaveLLC” from your Account.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to={route.companies} className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Company */}
      <div
        className={
          activityToggle ? "toggle-popup sidebar-popup" : "toggle-popup"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Company</h4>
            <Link
              to="#"
              className="sidebar-close toggle-btn"
              onClick={() => dispatch(setActivityTogglePopup(!activityToggle))}
            >
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <form action="#" className="toggle-height">
              <div className="pro-create">
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
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    className="preview1"
                                    alt="img"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="ti ti-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Name
                              </label>
                              <input type="text" className="form-control" />
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
                                    defaultChecked={true}
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
                              <label className="col-form-label">
                                Website <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Ratings</label>
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
                              <SelectWithImage2 />
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
                                defaultValue="Collab"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="d-flex align-items-center justify-content-between">
                                <label className="col-form-label">Deals</label>
                                <Link
                                  to="#"
                                  className="label-add add-popups"
                                  onClick={() =>
                                    dispatch(
                                      setAddTogglePopupTwo(!addTogglePopupTwo)
                                    )
                                  }
                                >
                                  <i className="ti ti-square-rounded-plus" />
                                  Add New
                                </Link>
                              </div>
                              <Select
                                className="select2"
                                options={dealsopen}
                                placeholder="Choose"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Source <span className="text-danger">*</span>
                              </label>

                              <Select
                                className="select2"
                                options={activities}
                                placeholder="Choose"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Industry <span className="text-danger">*</span>
                              </label>
                              <Select
                                className="select"
                                options={industries}
                                placeholder="Choose"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Contact <span className="text-danger">*</span>
                              </label>
                              <SelectWithImage2 />
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
                              <Select
                                className="select"
                                options={languages}
                                placeholder="Choose"
                                styles={customStyles}
                              />
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
                                Street Address
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
                                State / Province
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
                              <label className="col-form-label">Country</label>
                              <Select
                                className="select"
                                options={countries}
                                placeholder="USA"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap mb-wrap">
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
                            <div className="form-wrap mb-wrap">
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
                                    defaultChecked={true}
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
      {/* /Add Company */}
      {/* Edit Company */}
      <div
        className={
          activityToggleTwo ? "toggle-popup1 sidebar-popup" : "toggle-popup1"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Edit Company</h4>
            <Link
              to="#"
              className="sidebar-close1 toggle-btn"
              onClick={() =>
                dispatch(setActivityTogglePopupTwo(!activityToggleTwo))
              }
            >
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <form action="#" className="toggle-height">
              <div className="pro-create">
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
                            <div className="form-wrap">
                              <div className="profile-upload">
                                <div className="profile-upload-img">
                                  <span>
                                    <i className="ti ti-photo" />
                                  </span>
                                  <ImageWithBasePath
                                    src="assets/img/icons/company-icon-03.svg"
                                    className="preview1"
                                    alt="img"
                                  />
                                  <button
                                    type="button"
                                    className="profile-remove"
                                  >
                                    <i className="ti ti-x" />
                                  </button>
                                </div>
                                <div className="profile-upload-content">
                                  <label className="profile-upload-btn">
                                    <i className="ti ti-file-broken" /> Upload
                                    File
                                    <input type="file" className="input-img" />
                                  </label>
                                  <p>JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Company Name
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                defaultValue="NovaWave LLC"
                              />
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
                                    defaultChecked={true}
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
                              <label className="col-form-label">
                                Website <span className="text-danger">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Ratings </label>
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
                              <SelectWithImage2 />
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
                                defaultValue="Collab"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <div className="d-flex align-items-center justify-content-between">
                                <label className="col-form-label">Deals</label>
                                <Link
                                  to="#"
                                  className="label-add add-popups"
                                  onClick={() =>
                                    dispatch(
                                      setAddTogglePopupTwo(!addTogglePopupTwo)
                                    )
                                  }
                                >
                                  <i className="ti ti-square-rounded-plus" />
                                  Add New
                                </Link>
                              </div>
                              <Select
                                className="select2"
                                options={dealsopen}
                                placeholder="Choose"
                                styles={customStyles}
                              />
                              {/* <select className="select2">
                            <option>Choose</option>
                            <option selected="">Collins</option>
                            <option>Konopelski</option>
                            <option>Adams</option>
                            <option>Schumm</option>
                            <option>Wisozk</option>
                          </select> */}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Source <span className="text-danger">*</span>
                              </label>

                              <Select
                                className="select2"
                                options={activities}
                                placeholder="Choose"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Industry <span className="text-danger">*</span>
                              </label>
                              {/* <select className="select">
                            <option>Choose</option>
                            <option>Retail Industry</option>
                            <option selected="">Banking</option>
                            <option>Hotels</option>
                            <option>Financial Services</option>
                            <option>Insurance</option>
                          </select> */}
                              <Select
                                className="select"
                                options={industries}
                                placeholder="Banking"
                                styles={customStyles}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Contact <span className="text-danger">*</span>
                              </label>
                              <SelectWithImage2 />
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
                              <Select
                                className="select"
                                options={languages}
                                placeholder="English"
                                styles={customStyles}
                              />
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
                                Street Address
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
                                State / Province
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
                              <Select
                                className="select"
                                options={countries}
                                placeholder="USA"
                                styles={customStyles}
                              />
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
                                    defaultChecked={true}
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
              </div>
              <div className="submit-button text-end">
                <Link to="#" className="btn btn-light sidebar-close1">
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
      {/* /Edit Company */}
      {/* Delete Company */}
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
                <h3>Remove Companies?</h3>
                <p className="del-info">
                  Company ”NovaWaveLLC” from your Account.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    to={route.companies}
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
      {/* /Delete Company */}
      {/* Add New Deals */}
      <div
        className={
          addTogglePopupTwo ? "toggle-popup2 sidebar-popup" : "toggle-popup2"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Deals</h4>
            <Link
              to="#"
              className="sidebar-close2 toggle-btn"
              onClick={() => dispatch(setAddTogglePopupTwo(!addTogglePopupTwo))}
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
                        Deal Name <span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="col-form-label">
                          Pipeine <span className="text-danger">*</span>
                        </label>
                      </div>
                      <Select
                        className="select2"
                        options={salestypelist}
                        placeholder="Choose"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Status <span className="text-danger">*</span>
                      </label>
                      <Select
                        className="select2"
                        options={status}
                        placeholder="Choose"
                        styles={customStyles}
                      />
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
                      <Select
                        className="select2"
                        options={optionssymbol}
                        placeholder="Choose"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Period <span className="text-danger">*</span>
                      </label>
                      <Select
                        className="select2"
                        options={duration}
                        placeholder="Choose"
                        styles={customStyles}
                      />
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
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Contact <span className="text-danger">*</span>
                      </label>
                      <SelectWithImage2 />
                    </div>
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Project <span className="text-danger">*</span>
                      </label>
                      <Select
                        className="select2"
                        options={project}
                        defaultValue={tagInputValues}
                        isMulti
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Due Date <span className="text-danger">*</span>
                      </label>
                      <div className="icon-form">
                        <span className="form-icon">
                          <i className="ti ti-calendar-check" />
                        </span>
                        <DatePicker
                          className="form-control datetimepicker deals-details"
                          selected={selectedDate}
                          onChange={handleDateChange}
                          dateFormat="dd-MM-yyyy"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Expected Closing Date{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <div className="icon-form">
                        <span className="form-icon">
                          <i className="ti ti-calendar-check" />
                        </span>

                        <DatePicker
                          className="form-control datetimepicker deals-details"
                          selected={selectedDate1}
                          onChange={handleDateChange1}
                          dateFormat="dd-MM-yyyy"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Assignee <span className="text-danger">*</span>
                      </label>
                      <SelectWithImage2 />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Follow Up Date <span className="text-danger">*</span>
                      </label>
                      <div className="icon-form">
                        <span className="form-icon">
                          <i className="ti ti-calendar-check" />
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
                      <label className="col-form-label">
                        Source <span className="text-danger">*</span>
                      </label>

                      <Select
                        className="select2"
                        options={socialMedia}
                        placeholder="Choose"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Tags <span className="text-danger">*</span>
                      </label>
                      <input
                        className="input-tags form-control"
                        type="text"
                        data-role="tagsinput"
                        name="Label"
                        defaultValue="Collab, Rated"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Priority <span className="text-danger">*</span>
                      </label>
                      <Select
                        className="select2"
                        options={priorityList}
                        placeholder="Choose"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <DefaultEditor className="summernote" />
                    </div>
                  </div>
                </div>
                <div className="submit-button text-end">
                  <Link to="#" className="btn btn-light sidebar-close2">
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-primary">
                    Create
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add New Deals */}
    </>
  );
};

export default Companies;
