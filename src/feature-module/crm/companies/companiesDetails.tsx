import React, { useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivityTogglePopup,
  setActivityTogglePopupTwo,
} from "../../../core/data/redux/commonSlice";
import Select from "react-select";
import {
  ascendingandDecending,
  companyName,
  customStyles,
  languageOptions,
  optionssymbol,
  priorityList,
  salestypelist,
  socialMedia,
  status,
  statusList,
} from "../../../core/common/selectoption/selectoption";
import DatePicker from "react-datepicker";
import { TagsInput } from "react-tag-input-component";
import DefaultEditor from "react-simple-wysiwyg";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header";
import { SelectWithImage } from "../../../core/common/selectWithImage";

const CompaniesDetails = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const activityToggle = useSelector(
    (state: any) => state?.activityTogglePopup
  );
  const activityToggleTwo = useSelector(
    (state: any) => state?.activityTogglePopupTwo
  );
  const [owner, setOwner] = useState(["Collab"]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };
  const [selectedDate1, setSelectedDate1] = useState<Date | null>(new Date());
  const handleDateChange1 = (date: Date | null) => {
    setSelectedDate1(date);
  };
  const [selectedDate2, setSelectedDate2] = useState<Date | null>(new Date());
  const handleDateChange2 = (date: Date | null) => {
    setSelectedDate2(date);
  };
  const [selectedDate4, setSelectedDate4] = useState<Date | null>(new Date());
  const handleDateChange4 = (date: Date | null) => {
    setSelectedDate4(date);
  };
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
  const countries = [
    { value: "Choose", label: "Choose" },
    { value: "India", label: "India" },
    { value: "USA", label: "USA" },
    { value: "France", label: "France" },
    { value: "UAE", label: "UAE" },
  ];
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
                  <div className="col-sm-4">
                    <h4 className="page-title">Company Overview</h4>
                  </div>
                  <div className="col-sm-8 text-sm-end">
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
            <div className="col-md-12">
              {/* Contact User */}
              <div className="contact-head">
                <div className="row align-items-center">
                  <div className="col-sm-6">
                    <ul className="contact-breadcrumb">
                      <li>
                        <Link to={route.companies}>
                          <i className="ti ti-arrow-narrow-left" />
                          Company
                        </Link>
                      </li>
                      <li>NovaWave LLC</li>
                    </ul>
                  </div>
                  <div className="col-sm-6 text-sm-end">
                    <div className="contact-pagination">
                      <p>1 of 40</p>
                      <ul>
                        <li>
                          <Link to={route.companyDetails}>
                            <i className="ti ti-chevron-left" />
                          </Link>
                        </li>
                        <li>
                          <Link to={route.companyDetails}>
                            <i className="ti ti-chevron-right" />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="contact-wrap">
                <div className="contact-profile">
                  <div className="avatar company-avatar">
                    <ImageWithBasePath
                      src="assets/img/icons/company-icon-01.svg"
                      alt="img"
                    />
                  </div>
                  <div className="name-user">
                    <h5>NovaWave LLC</h5>
                    <p>
                      <i className="ti ti-map-pin-pin me-1" />
                      22, Ave Street, Newyork, USA
                    </p>
                    <div className="badge-rate">
                      <p>
                        <i className="fa-solid fa-star" /> 5.0
                      </p>
                    </div>
                  </div>
                </div>
                <div className="contacts-action">
                  <Link to="#" className="btn-icon rating">
                    <i className="fa-solid fa-star" />
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-danger add-popup"
                    onClick={() =>
                      dispatch(setActivityTogglePopup(!activityToggle))
                    }
                  >
                    <i className="ti ti-circle-plus" />
                    Add Deal
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_compose"
                  >
                    <i className="ti ti-mail" />
                    Send Email
                  </Link>
                  <Link to={route.chat} className="btn-icon">
                    <i className="ti ti-brand-hipchat" />
                  </Link>
                  <Link
                    to="#"
                    className="btn-icon edit-popup"
                    onClick={() =>
                      dispatch(setActivityTogglePopupTwo(!activityToggleTwo))
                    }
                  >
                    <i className="ti ti-edit-circle" />
                  </Link>
                  <div className="act-dropdown">
                    <Link
                      to="#"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right">
                      <Link
                        className="dropdown-item"
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_contact"
                      >
                        <i className="ti ti-trash text-danger" />
                        Delete
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Contact User */}
            </div>
            {/* Contact Sidebar */}
            <div className="col-xl-3 theiaStickySidebar">
              <div className="stickybar">
                <div className="contact-sidebar">
                  <h6>Basic Information</h6>
                  <ul className="basic-info">
                    <li>
                      <span>
                        <i className="ti ti-mail" />
                      </span>
                      <p>NovaW@example.com</p>
                    </li>
                    <li>
                      <span>
                        <i className="ti ti-phone" />
                      </span>
                      <p>+1 12445-47878</p>
                    </li>
                    <li>
                      <span>
                        <i className="ti ti-calendar-exclamation" />
                      </span>
                      <p>Created on 5 Jan 2024, 10:30 am</p>
                    </li>
                  </ul>
                  <h6>Other Information</h6>
                  <ul className="other-info">
                    <li>
                      <span className="other-title">Language</span>
                      <span>Language</span>
                    </li>
                    <li>
                      <span className="other-title">Currency</span>
                      <span>United States dollar</span>
                    </li>
                    <li>
                      <span className="other-title">Last Modified</span>
                      <span>27 Sep 2023, 11:45 pm</span>
                    </li>
                    <li>
                      <span className="other-title">Source</span>
                      <span>Paid Campaign</span>
                    </li>
                  </ul>
                  <h6>Tags</h6>
                  <ul className="tag-info">
                    <li>
                      <Link
                        to="#"
                        className="badge badge-tag badge-success-light"
                      >
                        Collab
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="badge badge-tag badge-warning-light"
                      >
                        Rated
                      </Link>
                    </li>
                  </ul>
                  <div className="con-sidebar-title">
                    <h6>Company</h6>
                    <Link to="#" className="com-add add-popups">
                      <i className="ti ti-circle-plus me-1" />
                      Add New
                    </Link>
                  </div>
                  <ul className="company-info com-info">
                    <li>
                      <span>
                        <ImageWithBasePath
                          src="assets/img/icons/company-icon-01.svg"
                          alt="img"
                        />
                      </span>
                      <div>
                        <h6>NovaWaveLLC</h6>
                        <p>
                          <i className="fa-solid fa-star" />
                          3.5
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>
                        <ImageWithBasePath
                          src="assets/img/icons/company-icon-02.svg"
                          alt="img"
                        />
                      </span>
                      <div>
                        <h6>BlueSky Industries</h6>
                        <p>
                          <i className="fa-solid fa-star" />
                          4.2
                        </p>
                      </div>
                    </li>
                  </ul>
                  <h6>Social Profile</h6>
                  <ul className="social-info">
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-youtube" />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-facebook-f" />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-instagram" />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-whatsapp" />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-pinterest" />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="fa-brands fa-linkedin" />
                      </Link>
                    </li>
                  </ul>
                  <h6>Settings</h6>
                  <ul className="set-info">
                    <li>
                      <Link to="#">
                        <i className="ti ti-share-2" />
                        Share Company
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <i className="ti ti-star" />
                        Add to Favourite
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_contact"
                      >
                        <i className="ti ti-trash-x" />
                        Delete Company
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* /Contact Sidebar */}
            {/* Contact Details */}
            <div className="col-xl-9">
              <div className="contact-tab-wrap">
                <ul className="contact-nav nav">
                  <li>
                    <Link
                      to="#"
                      data-bs-toggle="tab"
                      data-bs-target="#activities"
                      className="active"
                    >
                      <i className="ti ti-alarm-minus" />
                      Activities
                    </Link>
                  </li>
                  <li>
                    <Link to="#" data-bs-toggle="tab" data-bs-target="#notes">
                      <i className="ti ti-notes" />
                      Notes
                    </Link>
                  </li>
                  <li>
                    <Link to="#" data-bs-toggle="tab" data-bs-target="#calls">
                      <i className="ti ti-phone" />
                      Calls
                    </Link>
                  </li>
                  <li>
                    <Link to="#" data-bs-toggle="tab" data-bs-target="#files">
                      <i className="ti ti-file" />
                      Files
                    </Link>
                  </li>
                  <li>
                    <Link to="#" data-bs-toggle="tab" data-bs-target="#email">
                      <i className="ti ti-mail-check" />
                      Email
                    </Link>
                  </li>
                </ul>
              </div>
              {/* Tab Content */}
              <div className="contact-tab-view">
                <div className="tab-content pt-0">
                  {/* Activities */}
                  <div className="tab-pane active show" id="activities">
                    <div className="view-header">
                      <h4>Activities</h4>
                      <ul>
                        <li>
                          <div className="form-sort">
                            <i className="ti ti-sort-ascending-2" />

                            <Select
                              className="select"
                              options={ascendingandDecending}
                              placeholder="Ascending"
                            />
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div className="contact-activity">
                      <div className="badge-day">
                        <i className="ti ti-calendar-check" />
                        29 Aug 2023
                      </div>
                      <ul>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-pending">
                            <i className="ti ti-mail-code" />
                          </span>
                          <div className="activity-info">
                            <h6>You sent 1 Message to the contact.</h6>
                            <p>10:25 pm</p>
                          </div>
                        </li>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-secondary-success">
                            <i className="ti ti-phone" />
                          </span>
                          <div className="activity-info">
                            <h6>
                              Denwar responded to your appointment schedule
                              question by call at 09:30pm.
                            </h6>
                            <p>09:25 pm</p>
                          </div>
                        </li>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-orange">
                            <i className="ti ti-notes" />
                          </span>
                          <div className="activity-info">
                            <h6>Notes added by Antony</h6>
                            <p>
                              Please accept my apologies for the inconvenience
                              caused. It would be much appreciated if it's
                              possible to reschedule to 6:00 PM, or any other
                              day that week.
                            </p>
                            <p>10.00 pm</p>
                          </div>
                        </li>
                      </ul>
                      <div className="badge-day">
                        <i className="ti ti-calendar-check" />
                        28 Feb 2024
                      </div>
                      <ul>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-info">
                            <i className="ti ti-user-pin" />
                          </span>
                          <div className="activity-info">
                            <h6>
                              Meeting With{" "}
                              <span className="avatar-xs">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-19.jpg"
                                  alt="img"
                                />
                              </span>{" "}
                              Abraham
                            </h6>
                            <p>Schedueled on 05:00 pm</p>
                          </div>
                        </li>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-secondary-success">
                            <i className="ti ti-phone" />
                          </span>
                          <div className="activity-info">
                            <h6>
                              Drain responded to your appointment schedule
                              question.
                            </h6>
                            <p>09:25 pm</p>
                          </div>
                        </li>
                      </ul>
                      <div className="badge-day">
                        <i className="ti ti-calendar-check" />
                        Upcoming Activity
                      </div>
                      <ul>
                        <li className="activity-wrap">
                          <span className="activity-icon bg-info">
                            <i className="ti ti-user-pin" />
                          </span>
                          <div className="activity-info">
                            <h6>Product Meeting</h6>
                            <p>
                              A product team meeting is a gathering of the
                              cross-functional product team — ideally including
                              team members from product, engineering, marketing,
                              and customer support.
                            </p>
                            <p>25 Jul 2023, 05:00 pm</p>
                            <div className="upcoming-info">
                              <div className="row">
                                <div className="col-sm-4">
                                  <p>Reminder</p>
                                  <div className="dropdown">
                                    <Link
                                      to="#"
                                      className="dropdown-toggle"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="ti ti-clock-edit me-1" />
                                      Reminder
                                      <i className="ti ti-chevron-down ms-1" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link className="dropdown-item" to="#">
                                        Remainder
                                      </Link>
                                      <Link className="dropdown-item" to="#">
                                        1 hr
                                      </Link>
                                      <Link className="dropdown-item" to="#">
                                        10 hr
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-sm-4">
                                  <p>Task Priority</p>
                                  <div className="dropdown">
                                    <Link
                                      to="#"
                                      className="dropdown-toggle"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="ti ti-square-rounded-filled me-1 text-danger circle" />
                                      High
                                      <i className="ti ti-chevron-down ms-1" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link className="dropdown-item" to="#">
                                        <i className="ti ti-square-rounded-filled me-1 text-danger circle" />
                                        High
                                      </Link>
                                      <Link className="dropdown-item" to="#">
                                        <i className="ti ti-square-rounded-filled me-1 text-success circle" />
                                        Low
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-sm-4">
                                  <p>Assigned to</p>
                                  <div className="dropdown">
                                    <Link
                                      to="#"
                                      className="dropdown-toggle"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <ImageWithBasePath
                                        src="assets/img/profiles/avatar-19.jpg"
                                        alt="img"
                                        className="avatar-xs"
                                      />
                                      John
                                      <i className="ti ti-chevron-down ms-1" />
                                    </Link>
                                    <div className="dropdown-menu dropdown-menu-right">
                                      <Link className="dropdown-item" to="#">
                                        <ImageWithBasePath
                                          src="assets/img/profiles/avatar-19.jpg"
                                          alt="img"
                                          className="avatar-xs"
                                        />
                                        John
                                      </Link>
                                      <Link className="dropdown-item" to="#">
                                        <ImageWithBasePath
                                          src="assets/img/profiles/avatar-19.jpg"
                                          alt="img"
                                          className="avatar-xs"
                                        />
                                        Peter
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
                  {/* /Activities */}
                  {/* Notes */}
                  <div className="tab-pane fade" id="notes">
                    <div className="view-header">
                      <h4>Notes</h4>
                      <ul>
                        <li>
                          <div className="form-sort">
                            <i className="ti ti-sort-ascending-2" />
                            <Select
                              className="select"
                              options={ascendingandDecending}
                              placeholder="Ascending"
                            />
                          </div>
                        </li>
                        <li>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#add_notes"
                            className="com-add"
                          >
                            <i className="ti ti-circle-plus me-1" />
                            Add New
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="notes-activity">
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-19.jpg"
                              alt="img"
                            />
                            <div>
                              <h6>Darlee Robertson</h6>
                              <p>15 Sep 2023, 12:10 pm</p>
                            </div>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <h5>Notes added by Antony</h5>
                        <p>
                          A project review evaluates the success of an
                          initiative and identifies areas for improvement. It
                          can also evaluate a current project to determine
                          whether it's on the right track. Or, it can determine
                          the success of a completed project.{" "}
                        </p>
                        <ul>
                          <li>
                            <div className="note-download">
                              <div className="note-info">
                                <span className="note-icon bg-secondary-success">
                                  <i className="ti ti-file-spreadsheet" />
                                </span>
                                <div>
                                  <h6>Project Specs.xls</h6>
                                  <p>365 KB</p>
                                </div>
                              </div>
                              <Link to="#">
                                <i className="ti ti-arrow-down" />
                              </Link>
                            </div>
                          </li>
                          <li>
                            <div className="note-download">
                              <div className="note-info">
                                <span className="note-icon">
                                  <ImageWithBasePath
                                    src="assets/img/media/media-35.jpg"
                                    alt="img"
                                  />
                                </span>
                                <div>
                                  <h6>090224.jpg</h6>
                                  <p>365 KB</p>
                                </div>
                              </div>
                              <Link to="#">
                                <i className="ti ti-arrow-down" />
                              </Link>
                            </div>
                          </li>
                        </ul>
                        <div className="notes-editor">
                          <div className="note-edit-wrap">
                            <div className="summernote">
                              Write a new comment, send your team notification
                              by typing @ followed by their name
                            </div>
                            <div className="text-end note-btns">
                              <Link to="#" className="btn btn-light add-cancel">
                                Cancel
                              </Link>
                              <Link to="#" className="btn btn-primary">
                                Save
                              </Link>
                            </div>
                          </div>
                          <div className="text-end">
                            <Link to="#" className="add-comment">
                              <i className="ti ti-square-plus me-1" />
                              Add Comment
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-20.jpg"
                              alt="img"
                            />
                            <div>
                              <h6>Sharon Roy</h6>
                              <p>18 Sep 2023, 09:52 am</p>
                            </div>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <h5>Notes added by Antony</h5>
                        <p>
                          A project plan typically contains a list of the
                          essential elements of a project, such as stakeholders,
                          scope, timelines, estimated cost and communication
                          methods. The project manager typically lists the
                          information based on the assignment.
                        </p>
                        <ul>
                          <li>
                            <div className="note-download">
                              <div className="note-info">
                                <span className="note-icon bg-secondary-success">
                                  <i className="ti ti-file-text" />
                                </span>
                                <div>
                                  <h6>Andrewpass.txt</h6>
                                  <p>365 KB</p>
                                </div>
                              </div>
                              <Link to="#">
                                <i className="ti ti-arrow-down" />
                              </Link>
                            </div>
                          </li>
                        </ul>
                        <div className="reply-box">
                          <p>
                            The best way to get a project done faster is to
                            start sooner. A goal without a timeline is just a
                            dream.The goal you set must be challenging. At the
                            same time, it should be realistic and attainable,
                            not impossible to reach.
                          </p>
                          <p>
                            Commented by{" "}
                            <span className="text-purple">Aeron</span> on 15 Sep
                            2023, 11:15 pm
                          </p>
                          <Link to="#" className="btn">
                            <i className="ti ti-arrow-back-up-double" />
                            Reply
                          </Link>
                        </div>
                        <div className="notes-editor">
                          <div className="note-edit-wrap">
                            <div className="summernote">
                              Write a new comment, send your team notification
                              by typing @ followed by their name
                            </div>
                            <div className="text-end note-btns">
                              <Link to="#" className="btn btn-light add-cancel">
                                Cancel
                              </Link>
                              <Link to="#" className="btn btn-primary">
                                Save
                              </Link>
                            </div>
                          </div>
                          <div className="text-end">
                            <Link to="#" className="add-comment">
                              <i className="ti ti-square-plus me-1" />
                              Add Comment
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-21.jpg"
                              alt="img"
                            />
                            <div>
                              <h6>Vaughan</h6>
                              <p>20 Sep 2023, 10:26 pm</p>
                            </div>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p>
                          Projects play a crucial role in the success of
                          organizations, and their importance cannot be
                          overstated. Whether it's launching a new product,
                          improving an existing
                        </p>
                        <div className="notes-editor">
                          <div className="note-edit-wrap">
                            <div className="summernote">
                              Write a new comment, send your team notification
                              by typing @ followed by their name
                            </div>
                            <div className="text-end note-btns">
                              <Link to="#" className="btn btn-light add-cancel">
                                Cancel
                              </Link>
                              <Link to="#" className="btn btn-primary">
                                Save
                              </Link>
                            </div>
                          </div>
                          <div className="text-end">
                            <Link to="#" className="add-comment">
                              <i className="ti ti-square-plus me-1" />
                              Add Comment
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Notes */}
                  {/* Calls */}
                  <div className="tab-pane fade" id="calls">
                    <div className="view-header">
                      <h4>Calls</h4>
                      <ul>
                        <li>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#create_call"
                            className="com-add"
                          >
                            <i className="ti ti-circle-plus me-1" />
                            Add New
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="calls-activity">
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-19.jpg"
                              alt="img"
                            />
                            <p>
                              <span>Darlee Robertson</span> logged a call on 23
                              Jul 2023, 10:00 pm
                            </p>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown call-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Busy
                                <i className="ti ti-chevron-down ms-2" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  Busy
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  No Answer
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Unavailable
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Wrong Number
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Left Voice Message
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Moving Forward
                                </Link>
                              </div>
                            </div>
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p>
                          A project review evaluates the success of an
                          initiative and identifies areas for improvement. It
                          can also evaluate a current project to determine
                          whether it's on the right track. Or, it can determine
                          the success of a completed project.{" "}
                        </p>
                      </div>
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-20.jpg"
                              alt="img"
                            />
                            <p>
                              <span>Sharon Roy</span> logged a call on 28 Jul
                              2023, 09:00 pm
                            </p>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown call-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle bg-pending"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                No Answer
                                <i className="ti ti-chevron-down ms-2" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  Busy
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  No Answer
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Unavailable
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Wrong Number
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Left Voice Message
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Moving Forward
                                </Link>
                              </div>
                            </div>
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p>
                          A project plan typically contains a list of the
                          essential elements of a project, such as stakeholders,
                          scope, timelines, estimated cost and communication
                          methods. The project manager typically lists the
                          information based on the assignment.
                        </p>
                      </div>
                      <div className="calls-box">
                        <div className="caller-info">
                          <div className="calls-user">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-21.jpg"
                              alt="img"
                            />
                            <p>
                              <span>Vaughan</span> logged a call on 30 Jul 2023,
                              08:00 pm
                            </p>
                          </div>
                          <div className="calls-action">
                            <div className="dropdown call-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle bg-pending"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                No Answer
                                <i className="ti ti-chevron-down ms-2" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  Busy
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  No Answer
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Unavailable
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Wrong Number
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Left Voice Message
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  Moving Forward
                                </Link>
                              </div>
                            </div>
                            <div className="dropdown action-drop">
                              <Link
                                to="#"
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-right">
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-edit text-blue" />
                                  Edit
                                </Link>
                                <Link className="dropdown-item" to="#">
                                  <i className="ti ti-trash text-danger" />
                                  Delete
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p>
                          Projects play a crucial role in the success of
                          organizations, and their importance cannot be
                          overstated. Whether it's launching a new product,
                          improving an existing
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* /Calls */}
                  {/* Files */}
                  <div className="tab-pane fade" id="files">
                    <div className="view-header">
                      <h4>Files</h4>
                    </div>
                    <div className="files-activity">
                      <div className="files-wrap">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="file-info">
                              <h4>Manage Documents</h4>
                              <p>
                                Send customizable quotes, proposals and
                                contracts to close deals faster.
                              </p>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <ul className="file-action">
                              <li>
                                <Link
                                  to="#"
                                  className="btn btn-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#new_file"
                                >
                                  Create Document
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="files-wrap">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="file-info">
                              <h4>Collier-Turner Proposal</h4>
                              <p>
                                Send customizable quotes, proposals and
                                contracts to close deals faster.
                              </p>
                              <div className="file-user">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-21.jpg"
                                  alt="img"
                                />
                                <div>
                                  <p>
                                    <span>Owner</span> Vaughan
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <ul className="file-action">
                              <li>
                                <span className="badge badge-tag badge-danger-light">
                                  Proposal
                                </span>
                              </li>
                              <li>
                                <span className="badge badge-tag bg-pending priority-badge">
                                  Draft
                                </span>
                              </li>
                              <li>
                                <div className="dropdown action-drop">
                                  <Link
                                    to="#"
                                    className="dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <i className="ti ti-dots-vertical" />
                                  </Link>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-edit text-blue" />
                                      Edit
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-trash text-danger" />
                                      Delete
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-download text-info" />
                                      Download
                                    </Link>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="files-wrap">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="file-info">
                              <h4>Collier-Turner Proposal</h4>
                              <p>
                                Send customizable quotes, proposals and
                                contracts to close deals faster.
                              </p>
                              <div className="file-user">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-01.jpg"
                                  alt="img"
                                />
                                <div>
                                  <p>
                                    <span>Owner</span> Jessica
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <ul className="file-action">
                              <li>
                                <span className="badge badge-tag badge-purple-light">
                                  Quote
                                </span>
                              </li>
                              <li>
                                <span className="badge bg-success priority-badge">
                                  Sent
                                </span>
                              </li>
                              <li>
                                <div className="dropdown action-drop">
                                  <Link
                                    to="#"
                                    className="dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <i className="ti ti-dots-vertical" />
                                  </Link>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-edit text-blue" />
                                      Edit
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-trash text-danger" />
                                      Delete
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-download text-info" />
                                      Download
                                    </Link>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="files-wrap">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="file-info">
                              <h4>Collier-Turner Proposal</h4>
                              <p>
                                Send customizable quotes, proposals and
                                contracts to close deals faster.
                              </p>
                              <div className="file-user">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-22.jpg"
                                  alt="img"
                                />
                                <div>
                                  <p>
                                    <span>Owner</span> Vaughan
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <ul className="file-action">
                              <li>
                                <span className="badge badge-tag badge-danger-light">
                                  Proposal
                                </span>
                              </li>
                              <li>
                                <span className="badge badge-tag bg-pending priority-badge">
                                  Draft
                                </span>
                              </li>
                              <li>
                                <div className="dropdown action-drop">
                                  <Link
                                    to="#"
                                    className="dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <i className="ti ti-dots-vertical" />
                                  </Link>
                                  <div className="dropdown-menu dropdown-menu-right">
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-edit text-blue" />
                                      Edit
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-trash text-danger" />
                                      Delete
                                    </Link>
                                    <Link className="dropdown-item" to="#">
                                      <i className="ti ti-download text-info" />
                                      Download
                                    </Link>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Files */}
                  {/* Email */}
                  <div className="tab-pane fade" id="email">
                    <div className="view-header">
                      <h4>Email</h4>
                      <ul>
                        <li>
                          <OverlayTrigger
                            placement="left"
                            overlay={
                              <Tooltip id="tooltip-left">
                                There are no email accounts configured. Please
                                configure your email account in order to
                                Send/Create Emails.
                              </Tooltip>
                            }
                          >
                            <Link
                              to="#"
                              className="com-add"
                              data-bs-toggle="tooltip"
                              data-bs-placement="left"
                              data-bs-custom-class="tooltip-dark"
                              data-bs-original-title="There are no email accounts configured. Please configure your email account in order to Send/Create Emails"
                            >
                              <i className="ti ti-circle-plus me-1" />
                              Create Email
                            </Link>
                          </OverlayTrigger>
                        </li>
                      </ul>
                    </div>
                    <div className="files-activity">
                      <div className="files-wrap">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="file-info">
                              <h4>Manage Emails</h4>
                              <p>
                                You can send and reply to emails directly via
                                this section.
                              </p>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <ul className="file-action">
                              <li>
                                <Link
                                  to="#"
                                  className="btn btn-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#create_email"
                                >
                                  Connect Account
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="files-wrap">
                        <div className="email-header">
                          <div className="row">
                            <div className="col top-action-left">
                              <div className="float-start d-none d-sm-block">
                                <input
                                  type="text"
                                  placeholder="Search Messages"
                                  className="form-control search-message"
                                />
                              </div>
                            </div>
                            <div className="col-auto top-action-right">
                              <div className="text-end">
                                <button
                                  type="button"
                                  title="Refresh"
                                  data-bs-toggle="tooltip"
                                  className="btn btn-white d-none d-md-inline-block me-1"
                                >
                                  <i className="fa-solid fa-rotate" />
                                </button>
                                <div className="btn-group">
                                  <Link to="#" className="btn btn-white">
                                    <i className="fa-solid fa-angle-left" />
                                  </Link>
                                  <Link to="#" className="btn btn-white">
                                    <i className="fa-solid fa-angle-right" />
                                  </Link>
                                </div>
                              </div>
                              <div className="text-end">
                                <span className="text-muted d-none d-md-inline-block">
                                  Showing 10 of 112{" "}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="email-content">
                          <div className="table-responsive">
                            <table className="table table-inbox table-hover">
                              <thead>
                                <tr>
                                  <th colSpan={6} className="ps-2">
                                    <input
                                      type="checkbox"
                                      className="checkbox-all"
                                    />
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  className="unread clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa fa-star starred " />
                                    </span>
                                  </td>
                                  <td className="name">John Doe</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td>
                                    <i className="fa-solid fa-paperclip" />
                                  </td>
                                  <td className="mail-date">13:14</td>
                                </tr>
                                <tr
                                  className="unread clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">Envato Account</td>
                                  <td className="subject">
                                    Important account security update from
                                    Envato
                                  </td>
                                  <td />
                                  <td className="mail-date">8:42</td>
                                </tr>
                                <tr
                                  className="clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">Twitter</td>
                                  <td className="subject">
                                    HRMS Bootstrap Admin Template
                                  </td>
                                  <td />
                                  <td className="mail-date">30 Nov</td>
                                </tr>
                                <tr
                                  className="unread clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">Richard Parker</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td />
                                  <td className="mail-date">18 Sep</td>
                                </tr>
                                <tr
                                  className="clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">John Smith</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td />
                                  <td className="mail-date">21 Aug</td>
                                </tr>
                                <tr
                                  className="clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">me, Robert Smith (3)</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td />
                                  <td className="mail-date">1 Aug</td>
                                </tr>
                                <tr
                                  className="unread clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">Codecanyon</td>
                                  <td className="subject">
                                    Welcome To Codecanyon
                                  </td>
                                  <td />
                                  <td className="mail-date">Jul 13</td>
                                </tr>
                                <tr
                                  className="clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">Richard Miles</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td>
                                    <i className="fa-solid fa-paperclip" />
                                  </td>
                                  <td className="mail-date">May 14</td>
                                </tr>
                                <tr
                                  className="unread clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa-regular fa-star" />
                                    </span>
                                  </td>
                                  <td className="name">John Smith</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td />
                                  <td className="mail-date">11/11/16</td>
                                </tr>
                                <tr
                                  className="clickable-row"
                                  
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="checkmail"
                                    />
                                  </td>
                                  <td>
                                    <span className="mail-important">
                                      <i className="fa fa-star starred " />
                                    </span>
                                  </td>
                                  <td className="name">Mike Litorus</td>
                                  <td className="subject">
                                    Lorem ipsum dolor sit amet, consectetuer
                                    adipiscing elit
                                  </td>
                                  <td />
                                  <td className="mail-date">10/31/16</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Email */}
                </div>
              </div>
              {/* /Tab Content */}
            </div>
            {/* /Contact Details */}
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
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
                <h3>Remove Company?</h3>
                <p className="del-info">
                  Company ”NovaWaveLLC” from your Account
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
      {/* /Delete Company */}
      {/* Add Note */}
      <div
        className="modal custom-modal fade modal-padding"
        id="add_notes"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Notes</h5>
              <button
                type="button"
                className="btn-close position-static"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body p-0">
              <form>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Title <span className="text-danger"> *</span>
                  </label>
                  <input className="form-control" type="text" />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Note <span className="text-danger"> *</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    defaultValue={""}
                  />
                </div>
                <div className="form-wrap">
                  <label className="col-form-label">
                    Attachment <span className="text-danger"> *</span>
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
                  <div className="upload-file">
                    <h6>Projectneonals teyys.xls</h6>
                    <p>4.25 MB</p>
                    <div className="progress">
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: "25%" }}
                        aria-valuenow={25}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className="black-text">45%</p>
                  </div>
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
                <div className="col-lg-12 text-end modal-btn">
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                  >
                    Confirm
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Note */}
      {/* Create Call Log */}
      <div
        className="modal custom-modal fade modal-padding"
        id="create_call"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create Call Log</h5>
              <button
                type="button"
                className="btn-close position-static"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body p-0">
              <form>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Status <span className="text-danger"> *</span>
                      </label>
                      <Select
                        className="select"
                        options={statusList}
                        placeholder="Ascending"
                      />
                    </div>
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Follow Up Date <span className="text-danger"> *</span>
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
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Note <span className="text-danger"> *</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="Add text"
                        defaultValue={""}
                      />
                    </div>
                    <div className="form-wrap">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" /> Create a followup task
                      </label>
                    </div>
                    <div className="text-end modal-btn">
                      <Link
                        to="#"
                        className="btn btn-light"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </Link>
                      <Link
                        className="btn btn-primary"
                        to="#"
                        data-bs-dismiss="modal"
                      >
                        Confirm
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Create Call Log */}
      {/* Add File */}
      <div
        className="modal custom-modal fade custom-modal-two modal-padding"
        id="new_file"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create New File</h5>
              <button
                type="button"
                className="btn-close position-static"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body p-0">
              <div className="add-info-fieldset">
                <div className="add-details-wizard">
                  <ul className="progress-bar-wizard">
                    <li className="active">
                      <span>
                        <i className="ti ti-file" />
                      </span>
                      <div className="multi-step-info">
                        <h6>Basic Info</h6>
                      </div>
                    </li>
                    <li>
                      <span>
                        <i className="ti ti-circle-plus" />
                      </span>
                      <div className="multi-step-info">
                        <h6>Add Recipient</h6>
                      </div>
                    </li>
                  </ul>
                </div>
                <fieldset id="first-field-file">
                  <form>
                    <div className="contact-input-set">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Choose Deal <span className="text-danger">*</span>
                            </label>
                            <select className="select">
                              <option>Select</option>
                              <option>Collins</option>
                              <option>Wisozk</option>
                              <option>Walter</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Document Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select className="select">
                              <option>Select</option>
                              <option>Contract</option>
                              <option>Proposal</option>
                              <option>Quote</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Owner <span className="text-danger">*</span>
                            </label>
                            <select className="select">
                              <option>Select</option>
                              <option>Admin</option>
                              <option>Jackson Daniel</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Title <span className="text-danger"> *</span>
                            </label>
                            <input className="form-control" type="text" />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Locale <span className="text-danger">*</span>
                            </label>
                            <select className="select">
                              <option>Select</option>
                              <option>en</option>
                              <option>es</option>
                              <option>ru</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="signature-wrap">
                            <h4>Signature</h4>
                            <ul className="nav sign-item">
                              <li className="nav-item">
                                <span
                                  className=" mb-0"
                                  data-bs-toggle="tab"
                                  data-bs-target="#nosign"
                                >
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="sign1"
                                    name="email"
                                  />
                                  <label htmlFor="sign1">
                                    <span className="sign-title">
                                      No Signature
                                    </span>
                                    This document does not require a signature
                                    before acceptance.
                                  </label>
                                </span>
                              </li>
                              <li className="nav-item">
                                <span
                                  className="active mb-0"
                                  data-bs-toggle="tab"
                                  data-bs-target="#use-esign"
                                >
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="sign2"
                                    name="email"
                                    defaultChecked={true}
                                  />
                                  <label htmlFor="sign2">
                                    <span className="sign-title">
                                      Use e-signature
                                    </span>
                                    This document require e-signature before
                                    acceptance.
                                  </label>
                                </span>
                              </li>
                            </ul>
                            <div className="tab-content">
                              <div
                                className="tab-pane show active"
                                id="use-esign"
                              >
                                <div className="input-block mb-0">
                                  <label className="col-form-label">
                                    Document Signers{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                </div>
                                <div className="sign-content">
                                  <div className="row">
                                    <div className="col-md-6">
                                      <div className="form-wrap">
                                        <input
                                          className="form-control"
                                          type="text"
                                          placeholder="Enter Name"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div className="d-flex align-items-center">
                                        <div className="float-none form-wrap me-3 w-100">
                                          <input
                                            className="form-control"
                                            type="text"
                                            placeholder="Email Address"
                                          />
                                        </div>
                                        <div className="input-btn form-wrap">
                                          <Link to="#" className="add-sign">
                                            <i className="ti ti-circle-plus" />
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="input-block mb-3">
                            <label className="col-form-label">
                              Content <span className="text-danger"> *</span>
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Add Content"
                              defaultValue={""}
                            />
                          </div>
                        </div>
                        <div className="col-lg-12 text-end form-wizard-button modal-btn">
                          <button className="btn btn-light" type="reset">
                            Reset
                          </button>
                          <button
                            className="btn btn-primary wizard-next-btn"
                            type="button"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </fieldset>
                <fieldset>
                  <form>
                    <div className="contact-input-set">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="signature-wrap">
                            <h4 className="mb-2">
                              Send the document to following signers
                            </h4>
                            <p>In order to send the document to the signers</p>
                            <div className="input-block mb-0">
                              <label className="col-form-label">
                                Recipients (Additional recipients)
                              </label>
                            </div>
                            <div className="sign-content">
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-wrap">
                                    <input
                                      className="form-control"
                                      type="text"
                                      placeholder="Enter Name"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="d-flex align-items-center">
                                    <div className="float-none form-wrap me-3 w-100">
                                      <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Email Address"
                                      />
                                    </div>
                                    <div className="input-btn form-wrap">
                                      <Link to="#" className="add-sign">
                                        <i className="ti ti-circle-plus" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Message Subject{" "}
                              <span className="text-danger"> *</span>
                            </label>
                            <input
                              className="form-control"
                              type="text"
                              placeholder="Enter Subject"
                            />
                          </div>
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Message Text{" "}
                              <span className="text-danger"> *</span>
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Your document is ready"
                              defaultValue={""}
                            />
                          </div>
                          <button className="btn btn-light mb-3">
                            Send Now
                          </button>
                          <div className="send-success">
                            <p>
                              <i className="ti ti-circle-check" /> Document sent
                              successfully to the selected recipients
                            </p>
                          </div>
                        </div>
                        <div className="col-lg-12 text-end form-wizard-button modal-btn">
                          <button className="btn btn-light" type="reset">
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            type="button"
                            data-bs-dismiss="modal"
                          >
                            Save &amp; Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add File */}
      {/* Connect Account */}
      <div className="modal custom-modal fade" id="create_email" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Connect Account</h5>
              <button
                type="button"
                className="btn-close position-static"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body p-0">
              <div className="form-wrap">
                <label className="col-form-label">
                  Account type <span className="text-danger"> *</span>
                </label>
                <select className="select">
                  <option>Gmail</option>
                  <option>Outlook</option>
                  <option>Imap</option>
                </select>
              </div>
              <div className="form-wrap">
                <h5 className="form-title">Sync emails from</h5>
                <div className="sync-radio">
                  <div className="radio-item">
                    <input
                      type="radio"
                      className="status-radio"
                      id="test1"
                      name="radio-group"
                      defaultChecked={true}
                    />
                    <label htmlFor="test1">Now</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      className="status-radio"
                      id="test2"
                      name="radio-group"
                    />
                    <label htmlFor="test2">1 Month Ago</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      className="status-radio"
                      id="test3"
                      name="radio-group"
                    />
                    <label htmlFor="test3">3 Month Ago</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      className="status-radio"
                      id="test4"
                      name="radio-group"
                    />
                    <label htmlFor="test4">6 Month Ago</label>
                  </div>
                </div>
              </div>
              <div className="col-lg-12 text-end modal-btn">
                <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </Link>
                <button
                  className="btn btn-primary"
                  data-bs-target="#success_mail"
                  data-bs-toggle="modal"
                  data-bs-dismiss="modal"
                >
                  Connect Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Connect Account */}
      {/* Success Company */}
      <div className="modal custom-modal fade" id="success_mail" role="dialog">
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
                  <i className="ti ti-mail-opened" />
                </div>
                <h3>Email Connected Successfully!!!</h3>
                <p>
                  Email Account is configured with “example@example.com”. Now you
                  can access email.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-primary">
                    Go to email
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Success Company */}
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
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                  >
                    Confirm
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Access */}
      {/* Add Compose */}
      <div className="modal custom-modal fade" id="add_compose" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Compose</h5>
              <button
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body p-0">
              <form action="#">
                <div className="form-wrap">
                  <input
                    type="email"
                    placeholder="To"
                    className="form-control"
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <input
                        type="email"
                        placeholder="Cc"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <input
                        type="email"
                        placeholder="Bcc"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-wrap">
                  <input
                    type="text"
                    placeholder="Subject"
                    className="form-control"
                  />
                </div>
                <div className="form-wrap">
                  <DefaultEditor className="summernote" />
                </div>
                <div className="form-wrap">
                  <div className="text-center">
                    <button className="btn btn-primary me-1">
                      <span>Send</span>
                      <i className="fa-solid fa-paper-plane ms-1" />
                    </button>
                    <button className="btn btn-primary me-1" type="button">
                      <span>Draft</span>{" "}
                      <i className="fa-regular fa-floppy-disk ms-1" />
                    </button>
                    <button className="btn btn-primary me-1" type="button">
                      <span>Delete</span>{" "}
                      <i className="fa-regular fa-trash-can ms-1" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Compose */}
      {/* Edit Contact */}
      <div
        className={
          activityToggleTwo ? "toggle-popup1 sidebar-popup" : "toggle-popup1"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Edit Contact</h4>
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
            <div className="pro-create">
              <form>
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
                                    src="assets/img/profiles/avatar-20.jpg"
                                    alt="img"
                                    className="preview1"
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

                              <Select
                                className="select"
                                options={companyName}
                                placeholder="NovaWave LLC"
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
                              <div className="d-flex align-items-center justify-content-between">
                                <label className="col-form-label">Deals</label>
                                <Link to="#" className="label-add add-popups">
                                  <i className="ti ti-square-rounded-plus" />
                                  Add New
                                </Link>
                              </div>

                              <Select
                                className="select"
                                options={dealsopen}
                                placeholder="NovaWave LLC"
                              />
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
                                <DatePicker
                                  className="form-control datetimepicker deals-details"
                                  selected={selectedDate1}
                                  onChange={handleDateChange1}
                                  dateFormat="dd-MM-yyyy"
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
                              <SelectWithImage />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">Tags </label>

                              <TagsInput
                                // className="input-tags form-control"
                                value={owner}
                                onChange={setOwner}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Source <span className="text-danger">*</span>
                              </label>

                              <Select
                                className="select"
                                options={activities}
                                placeholder="Phone Calls"
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
                                placeholder="Banking"
                              />
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
                                options={languageOptions}
                                placeholder="English"
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

                              <Select
                                className="select"
                                options={countries}
                                placeholder="USA"
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
      </div>
      {/* /Edit Contact */}
      {/* Add Company */}
      <div className="toggle-popup2">
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add Company</h4>
            <Link to="#" className="sidebar-close2 toggle-btn">
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <div className="pro-create">
              <form action="#">
                <div className="accordion-lists" id="list-accord">
                  {/* Basic Info */}
                  <div className="user-accordion-item">
                    <Link
                      to="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target="#add-basic"
                    >
                      <span>
                        <i className="ti ti-user-plus" />
                      </span>
                      Basic Info
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id="add-basic"
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
                                    id="mail"
                                    className="check"
                                    defaultChecked={true}
                                  />
                                  <label
                                    htmlFor="mail"
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
                              <label className="col-form-label">Rating </label>
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
                            <div className="form-wrap img-select">
                              <label className="col-form-label">Owner</label>
                              <select className="select2">
                                <option>Jerald</option>
                                <option>Guillory</option>
                                <option>Jami</option>
                                <option>Theresa</option>
                                <option>Espinosa</option>
                              </select>
                              <span className="select-box-img avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-14.jpg"
                                  alt=""
                                />
                              </span>
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
                          <div className="col-md-12">
                            <div className="form-wrap">
                              <label className="col-form-label">
                                Contact <span className="text-danger">*</span>
                              </label>
                              <select className="select2">
                                <option>Choose</option>
                                <option>John</option>
                                <option>Guillory</option>
                                <option>Jami</option>
                                <option>Theresa</option>
                                <option>Espinosa</option>
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
                      data-bs-target="#add-address"
                    >
                      <span>
                        <i className="ti ti-map-pin-cog" />
                      </span>
                      Address Info
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="add-address"
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
                      data-bs-target="#add-social"
                    >
                      <span>
                        <i className="ti ti-social" />
                      </span>
                      Social Profile
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="add-social"
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
                      data-bs-target="#add-access"
                    >
                      <span>
                        <i className="ti ti-accessible" />
                      </span>
                      Access
                    </Link>
                    <div
                      className="accordion-collapse collapse"
                      id="add-access"
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
                                    id="add-public"
                                    name="visible"
                                  />
                                  <label htmlFor="add-public">Public</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="add-private"
                                    name="visible"
                                  />
                                  <label htmlFor="add-private">Private</label>
                                </div>
                                <div
                                  className="radio-btn"
                                  data-bs-toggle="modal"
                                  data-bs-target="#access_view"
                                >
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="add-people"
                                    name="visible"
                                  />
                                  <label htmlFor="add-people">
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
                                    id="add-active"
                                    name="status"
                                    defaultChecked={true}
                                  />
                                  <label htmlFor="add-active">Active</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="add-inactive"
                                    name="status"
                                  />
                                  <label htmlFor="add-inactive">Inactive</label>
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
                  <Link to="#" className="btn btn-light sidebar-close2">
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
      {/* /Add Company */}
      {/* Add New Deals */}
      <div
        className={
          activityToggle ? "toggle-popup sidebar-popup" : "toggle-popup"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <h4>Add New Deals</h4>
            <Link
              to="#"
              className="sidebar-close toggle-btn"
              onClick={() => dispatch(setActivityTogglePopup(!activityToggle))}
            >
              <i className="ti ti-x" />
            </Link>
          </div>
          <div className="toggle-body">
            <div className="pro-create">
              <form>
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
                      <label className="col-form-label">
                        Pipeine <span className="text-danger">*</span>
                      </label>

                      <Select
                        className="select"
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
                        className="select"
                        options={optionssymbol}
                        placeholder="Select"
                        styles={customStyles}
                      />
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
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Contact <span className="text-danger">*</span>
                      </label>
                      <input
                        className="input-tags form-control"
                        type="text"
                        data-role="tagsinput"
                        name="Label"
                        defaultValue="Jack, Darlee Robertson"
                      />
                    </div>
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Project <span className="text-danger">*</span>
                      </label>
                      <input
                        className="input-tags form-control"
                        type="text"
                        data-role="tagsinput"
                        name="Label"
                        defaultValue="Divine dran"
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
                          selected={selectedDate2}
                          onChange={handleDateChange2}
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
                      <input
                        className="input-tags form-control"
                        type="text"
                        data-role="tagsinput"
                        name="Label"
                        defaultValue="James"
                      />
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

                        <DatePicker
                          className="form-control datetimepicker deals-details"
                          selected={selectedDate4}
                          onChange={handleDateChange4}
                          dateFormat="dd-MM-yyyy"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Source <span className="text-danger">*</span>
                      </label>

                      <Select
                        className="select"
                        options={socialMedia}
                        placeholder="Select"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Tags <span className="text-danger">*</span>
                      </label>
                      <TagsInput
                        // className="input-tags form-control"
                        value={owner}
                        onChange={setOwner}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Priority <span className="text-danger">*</span>
                      </label>

                      <Select
                        className="select"
                        options={priorityList}
                        placeholder="Select"
                        styles={customStyles}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <div className="summernote" />
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
      </div>
      {/* /Add New Deals */}
    </>
  );
};

export default CompaniesDetails;
