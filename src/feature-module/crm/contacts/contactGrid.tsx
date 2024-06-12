import React, { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import DateRangePicker from "react-bootstrap-daterangepicker";
import {
  countryoptions1,
  customStyles,
  initialSettings,
  languageOptions,
  optiondeals,
  optionindustry,
  options,
  options1,
  optionsource,
  optionsowner,
  optionssymbol,
  priorityList,
  salestypelist,
  socialMedia,
  status,
} from "../../../core/common/selectoption/selectoption";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivityTogglePopup,
  setActivityTogglePopupTwo,
} from "../../../core/data/redux/commonSlice";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { TagsInput } from "react-tag-input-component";
import CollapseHeader from "../../../core/common/collapse-header";

const ContactGrid = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const activityToggle = useSelector(
    (state: any) => state?.activityTogglePopup
  );
  const activityToggleTwo = useSelector(
    (state: any) => state?.activityTogglePopupTwo
  );
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
  const [owner, setOwner] = useState(["Collab"]);

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
                  <div className="col-8">
                    <h4 className="page-title">
                      Contacts<span className="count-title">123</span>
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
              {/* Card */}
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
                            placeholder="Search Contacts"
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
                                Add Contacts
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
                                className="form-control bookingrange"
                                type="text"
                              />
                            </DateRangePicker>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div className="filter-list">
                      <ul className="justify-content-md-end">
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
                        <li>
                          <div className="view-icons">
                            <Link to={route.contactList}>
                              <i className="ti ti-list-tree" />
                            </Link>
                            <Link to={route.contactGrid} className="active">
                              <i className="ti ti-grid-dots" />
                            </Link>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* /Filter */}
                  {/* Contact Grid */}
                  <div className="row" id="grid-row-view">
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-19.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Darlee Robertson
                                </Link>
                              </h6>
                              <p>Facility Manager</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              robertson@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              1234567890
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Germany
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              4.2
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-20.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Sharon Roy
                                </Link>
                              </h6>
                              <p>Installer</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              sharon@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 989757485
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              USA
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              5.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-21.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>Vaughan</Link>
                              </h6>
                              <p>Senior Manager</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              vaughan12@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 546555455
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Canada
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              3.5
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-23.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>Jessica</Link>
                              </h6>
                              <p>Test Engineer</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              jessica13@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 454478787
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              India
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              4.5
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-16.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Carol Thomas
                                </Link>
                              </h6>
                              <p>UI /UX Designer</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              caroltho3@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 124547845
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              China
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              4.7
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-22.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Dawn Mercha
                                </Link>
                              </h6>
                              <p>Technician</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              dawnmercha@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 478845447
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Japan
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              5.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-24.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Rachel Hampton
                                </Link>
                              </h6>
                              <p>Software Developer</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              rachel@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 215544845
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Indonesia
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              3.1
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-25.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Jonelle Curtiss
                                </Link>
                              </h6>
                              <p>Supervisor</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              jonelle@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 121145471
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Cuba
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              5.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-26.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>Jonathan</Link>
                              </h6>
                              <p>Team Lead Dev</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              jonathan@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 321454789
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Isreal
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              2.7
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-01.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>Brook</Link>
                              </h6>
                              <p>Team Lead Dev </p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              brook@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 278907145
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Colombia
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              3.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-06.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Eric Adams
                                </Link>
                              </h6>
                              <p>HR Manager</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              ericadams@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 19023-78104
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              France
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              3.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xxl-3 col-xl-4 col-md-6">
                      <div className="contact-grid">
                        <div className="grid-head">
                          <div className="users-profile">
                            <Link to={route.contactDetails} className="avatar">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-05.jpg"
                                alt="img"
                              />
                            </Link>
                            <div className="name-user">
                              <h6>
                                <Link to={route.contactDetails}>
                                  Richard Cooper
                                </Link>
                              </h6>
                              <p>Devops Engineer</p>
                            </div>
                          </div>
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
                                className="dropdown-item edit-popup"
                                to="#"
                                onClick={() =>
                                  dispatch(
                                    setActivityTogglePopupTwo(
                                      !activityToggleTwo
                                    )
                                  )
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
                              <Link
                                className="dropdown-item"
                                to={route.contactDetails}
                              >
                                <i className="ti ti-eye text-blue-light" />{" "}
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="grid-body">
                          <div className="address-info">
                            <p>
                              <i className="ti ti-mail" />
                              richard@example.com
                            </p>
                            <p>
                              <i className="ti ti-phone" />
                              +1 18902-63904
                            </p>
                            <p>
                              <i className="ti ti-map-pin-pin" />
                              Belgium
                            </p>
                          </div>
                          <div className="grid-badges">
                            <span className="badge badge-tag badge-success-light">
                              Collab
                            </span>
                            <span className="badge badge-tag badge-warning-light">
                              Rated
                            </span>
                          </div>
                        </div>
                        <div className="grid-footer d-flex justify-content-between">
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
                          <div className="star-user">
                            <div className="set-star">
                              <i className="fa fa-star filled me-1" />
                              3.0
                            </div>
                            <Link
                              to="#"
                              className="avatar"
                              data-bs-toggle="tooltip"
                              data-bs-original-title="Mervin"
                              data-bs-placement="top"
                            >
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="img"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* /Contact Grid */}
                  <div className="load-btn text-center">
                    <Link to="#" className="btn btn-primary">
                      Load More Contacts
                      <i className="ti ti-loader" />
                    </Link>
                  </div>
                </div>
              </div>
              {/* /Card */}
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add Contact */}
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
      {/* /Add Contact */}
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
                                  <img
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
                                options={options}
                                placeholder="NovaWave LLC"
                                styles={customStyles}
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
                              <div className="d-flex align-items-center justify-content-between">
                                <label className="col-form-label">Deals</label>
                                <Link to="#" className="label-add add-popups">
                                  <i className="ti ti-square-rounded-plus" />
                                  Add New
                                </Link>
                              </div>

                              <Select
                                className="select"
                                options={optiondeals}
                                placeholder="Collins"
                                styles={customStyles}
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
                              <Select
                                className="select"
                                options={optionsowner}
                                placeholder="Choose"
                                styles={customStyles}
                              />
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
                                defaultValue="Collab"
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
                                options={optionsource}
                                placeholder="Phone Calls"
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
                                options={optionindustry}
                                placeholder="Phone Calls"
                                styles={customStyles}
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
                                options={countryoptions1}
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
                <div className="submit-button text-end">
                  <Link to="#" className="btn btn-light sidebar-close1">
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
      {/* /Delete Contact */}
      {/* Add New Deals */}
      {/* <div className="toggle-popup2">
                <div className="sidebar-layout">
                    <div className="sidebar-header">
                        <h4>Add New Deals</h4>
                        <Link to="#" className="sidebar-close2 toggle-btn">
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
                                            <select className="select2">
                                                <option>Choose</option>
                                                <option>Sales</option>
                                                <option>Marketing</option>
                                                <option>Calls</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Status <span className="text-danger">*</span>
                                            </label>
                                            <select className="select2">
                                                <option>Choose</option>
                                                <option>Open</option>
                                                <option>Lost</option>
                                                <option>Won</option>
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
                                            <select className="select">
                                                <option>Choose</option>
                                                <option>Days</option>
                                                <option>Month</option>
                                            </select>
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
                                            <select className="multiple-img" multiple="multiple">
                                                <option
                                                    data-image="assets/img/profiles/avatar-19.jpg"
                                                    selected=""
                                                >
                                                    Darlee Robertson
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-20.jpg">
                                                    Sharon Roy
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-21.jpg">
                                                    Vaughan
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-23.jpg">
                                                    Jessica
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-16.jpg">
                                                    Carol Thomas
                                                </option>
                                            </select>
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Project <span className="text-danger">*</span>
                                            </label>
                                            <select className="select" multiple="multiple">
                                                <option selected="">Devops Design</option>
                                                <option selected="">MargrateDesign</option>
                                                <option selected="">UI for Chat</option>
                                                <option>Web Chat</option>
                                            </select>
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
                                                <input
                                                    type="text"
                                                    className="form-control datetimepicker"
                                                    placeholder=""
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Expected Closing Date <span className="text-danger">*</span>
                                            </label>
                                            <div className="icon-form">
                                                <span className="form-icon">
                                                    <i className="ti ti-calendar-check" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control datetimepicker"
                                                    placeholder=""
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Assignee <span className="text-danger">*</span>
                                            </label>
                                            <select className="multiple-img" multiple="multiple">
                                                <option data-image="assets/img/profiles/avatar-19.jpg">
                                                    Darlee Robertson
                                                </option>
                                                <option
                                                    data-image="assets/img/profiles/avatar-20.jpg"
                                                    selected=""
                                                >
                                                    Sharon Roy
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-21.jpg">
                                                    Vaughan
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-23.jpg">
                                                    Jessica
                                                </option>
                                                <option data-image="assets/img/profiles/avatar-16.jpg">
                                                    Carol Thomas
                                                </option>
                                            </select>
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
                                                    placeholder=""
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Source <span className="text-danger">*</span>
                                            </label>
                                            <select className="select">
                                                <option>Select</option>
                                                <option>Google</option>
                                                <option>Social Media</option>
                                            </select>
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
                                            <select className="select">
                                                <option>Select</option>
                                                <option>Highy</option>
                                                <option>Low</option>
                                                <option>Medium</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Description <span className="text-danger">*</span>
                                            </label>
                                            <div className="summernote" />
                                        </div>
                                    </div>
                                </div>
                                <div className="submit-button text-end">
                                    <Link to="#" className="btn btn-light sidebar-close2">
                                        Cancel
                                    </Link>
                                    <button type="submit" className="btn btn-primary">
                                        Create
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div> */}
      {/* /Add New Deals */}
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
                  <Link
                    to="#"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-danger">
                    Save
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add New View */}
    </>
  );
};

export default ContactGrid;
