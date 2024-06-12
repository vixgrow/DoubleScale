import React, { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CollapseHeader from "../../../core/common/collapse-header";
import Select from "react-select";
import { customStyles, options1 } from "../../../core/common/selectoption/selectoption";

const route = all_routes;
const DealsKanban = () => {
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
                      Deals<span className="count-title">123</span>
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
              {/* Filter */}
              <div className="filter-section filter-flex">
                <div className="sortby-list">
                  <ul>
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
                        <div className="filter-dropdown-menu dropdown-menu  dropdown-menu-start">
                          <div className="filter-set-view">
                            <div className="filter-set-head">
                              <h4>
                                <i className="ti ti-filter-share" />
                                Filter
                              </h4>
                              <Link
                                to="#"
                                data-bs-toggle="modal"
                                data-bs-target="#save_view"
                              >
                                Save View
                              </Link>
                            </div>
                            <div className="header-set">
                              <Select
                                styles={customStyles}
                                className="select"
                                options={options1}
                              />
                              <div className="radio-btn-items">
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="pdf"
                                    name="export-type"
                                    defaultChecked={true}
                                  />
                                  <label htmlFor="pdf">Just For Me</label>
                                </div>
                                <div className="radio-btn">
                                  <input
                                    type="radio"
                                    className="status-radio"
                                    id="share"
                                    name="export-type"
                                  />
                                  <label htmlFor="share">
                                    Share Filter with Everyone{" "}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="accordion" id="accordionExample">
                              <div className="filter-set-content">
                                <div className="filter-set-content-head">
                                  <Link
                                    to="#"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapseTwo"
                                    aria-expanded="true"
                                    aria-controls="collapseTwo"
                                  >
                                    Deals Name
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
                                              defaultChecked={true}
                                            />
                                            <span className="checkmarks" />
                                          </label>
                                        </div>
                                        <div className="collapse-inside-text">
                                          <h5>Collins</h5>
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
                                          <h5>Konopelski</h5>
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
                                          <h5>Adams</h5>
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
                                          <h5>Gutkowski</h5>
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
                                          <h5>Walter</h5>
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
                                              defaultChecked={true}
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
                                              defaultChecked={true}
                                            />
                                            <span className="checkmarks" />
                                          </label>
                                        </div>
                                        <div className="collapse-inside-text">
                                          <h5>Won</h5>
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
                                          <h5>Open</h5>
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
                                          <h5>Lost</h5>
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
                                              defaultChecked={true}
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
                                              defaultChecked={true}
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
                                    to={route.dealsKanban}
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
                    </li>
                  </ul>
                </div>
                <div className="filter-list">
                  <ul>
                    <li>
                      <div className="view-icons">
                        <Link to={route.deals}>
                          <i className="ti ti-list-tree" />
                        </Link>
                        <Link to={route.dealsKanban} className="active">
                          <i className="ti ti-grid-dots" />
                        </Link>
                      </div>
                    </li>
                    <li>
                      <Link to="#" className="btn btn-primary add-popup">
                        <i className="ti ti-square-rounded-plus" />
                        Add Deals
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              {/* /Filter */}
              {/* Deals Kanban */}
              <div className="kanban-wrapper">
                <div className="kanban-list-items">
                  <div className="kanban-list-head">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="kanban-title-head dot-success">
                        <h5>Qualify To Buy</h5>
                        <span>45 Leads - $15,44,540</span>
                      </div>
                      <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn">
                          <i className="ti ti-plus" />
                        </Link>
                        <div className="dropdown table-action">
                          <Link
                            to="#"
                            className="action-icon dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item edit-popup" to="#">
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_deal"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="kanban-drag-wrap">
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-purple" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>HT</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Howell, Tremblay and Rath
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $03,50,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              darleeo@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 12445-47878
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Newyork, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-19.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Darlee Robertson
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              85%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 10 Jan 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-warning" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>RJ</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Robert, John and Carlos
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $02,10,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              sheron@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 12445-47878
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Exeter, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-20.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Sharon Roy
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              15%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 12 Jan 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-success" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>WS</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Wendy, Star and David
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $04,22,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              vau@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 12445-47878
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Phoenix, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-21.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Vaughan
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              95%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 14 Jan 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="kanban-list-items">
                  <div className="kanban-list-head">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="kanban-title-head dot-info">
                        <h5>Contact Made</h5>
                        <span>30 Leads - $19,94,938</span>
                      </div>
                      <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn">
                          <i className="ti ti-plus" />
                        </Link>
                        <div className="dropdown table-action">
                          <Link
                            to="#"
                            className="action-icon dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item edit-popup" to="#">
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_deal"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="kanban-drag-wrap">
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-success" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>BR</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Byron, Roman and Bailey
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $02,45,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              jessica13@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 89351-90346
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Chester, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-01.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Jessica
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              47%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 06 Feb 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-purple" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>CH</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Robert, John and Carlos
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $01,17,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              caroltho3@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 78982-09163
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Charlotte, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Carol Thomas
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              98%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 15 Feb 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-danger" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>IC</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Irene, Charles and Wilston
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $02,12,000
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              dawnmercha@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 27691-89246
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Bristol, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-22.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Dawn Mercha
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              78%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 25 Jan 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="kanban-list-items">
                  <div className="kanban-list-head">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="kanban-title-head dot-warning">
                        <h5>Presentation</h5>
                        <span>25 Leads - $10,36.390</span>
                      </div>
                      <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn">
                          <i className="ti ti-plus" />
                        </Link>
                        <div className="dropdown table-action">
                          <Link
                            to="#"
                            className="action-icon dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item edit-popup" to="#">
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_deal"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="kanban-drag-wrap">
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-warning" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>HT</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Jody, Powell and Cecil
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $01,84,043
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              rachel@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 17839-93617
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Baltimore, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-23.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Rachel Hampton
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              25%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 18 Mar 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-success" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>BL</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Bonnie, Linda and Mullin
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $09,35,189
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              jonelle@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 16739-47193
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Coventry, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-24.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Jonelle Curtiss
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              70%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 15 Feb 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-purple" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>CJ</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Carlos, Jones and <br /> Jim
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $04,27,940
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              jonathan@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 18390-37153
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Seattle
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-25.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Jonathan
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              45%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 30 Jan 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="kanban-list-items">
                  <div className="kanban-list-head">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="kanban-title-head dot-purple">
                        <h5>Proposal Made</h5>
                        <span>50 Leads - $18,83,013</span>
                      </div>
                      <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn">
                          <i className="ti ti-plus" />
                        </Link>
                        <div className="dropdown table-action">
                          <Link
                            to="#"
                            className="action-icon dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu dropdown-menu-right">
                            <Link className="dropdown-item edit-popup" to="#">
                              <i className="fa-solid fa-pencil text-blue" />{" "}
                              Edit
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_deal"
                            >
                              <i className="fa-regular fa-trash-can text-danger" />{" "}
                              Delete
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="kanban-drag-wrap">
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-danger" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>FJ</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Freda,Jennfier and Thompson
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $04,17,593
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              sidney@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 11739-38135
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              London, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-17.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Sidney Franks
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              59%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" />
                            11 Apr 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-purple" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>BF</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Bruce, Faulkner and Lela
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $08,81,389
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              brook@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 19302-91043
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Detroit, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-26.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Brook
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              72%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 17 Apr 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="kanban-card">
                        <div className="kanban-card-head">
                          <span className="bar-design bg-warning" />
                          <div className="kanban-card-title">
                            <Link to={route.dealsDashboard}>
                              <span>LP</span>
                            </Link>
                            <h6>
                              <Link to={route.dealsDashboard}>
                                Lawrence, Patrick and Vandorn
                              </Link>
                            </h6>
                          </div>
                        </div>
                        <div className="kanban-card-body">
                          <ul>
                            <li>
                              <i className="ti ti-report-money" />
                              $09,27,193
                            </li>
                            <li>
                              <i className="ti ti-mail" />
                              mickey@example.com
                            </li>
                            <li>
                              <i className="ti ti-phone" />
                              +1 17280-92016
                            </li>
                            <li>
                              <i className="ti ti-map-pin-pin" />
                              Manchester, United States
                            </li>
                          </ul>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="card-user-info">
                              <Link to="#" className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt=""
                                />
                              </Link>
                              <Link to="#" className="user-name">
                                Mickey
                              </Link>
                            </div>
                            <span className="badge bg-blue">
                              <i className="ti ti-progress" />
                              20%
                            </span>
                          </div>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-calendar-due" /> 10 Feb 2024
                          </span>
                          <ul className="icons-social">
                            <li>
                              <Link to="#">
                                <i className="ti ti-phone-check" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-message-circle-2" />
                              </Link>
                            </li>
                            <li>
                              <Link to="#">
                                <i className="ti ti-color-swatch" />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              {/* /Deals Kanban */}
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
    </>
  );
};

export default DealsKanban;
