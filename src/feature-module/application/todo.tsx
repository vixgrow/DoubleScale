import React from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import Select from "react-select";
import {
  customStyles,
  lastModified,
  recent,
} from "../../core/common/selectoption/selectoption";
import TodoModal from "../../core/modals/todoModal";

const Todo = () => {
  const options = [
    { value: "bulk-actions", label: "Bulk Actions" },
    { value: "delete-marked", label: "Delete Marked" },
    { value: "unmark-all", label: "Unmark All" },
    { value: "mark-all", label: "Mark All" },
  ];

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header page-add-notes">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Todo</h4>
              <h6>Manage your tasks</h6>
            </div>
            <Link id="toggle_btn2" className="notes-tog" to="#">
              <i className="fas fa-chevron-left" />
            </Link>
          </div>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <div className="input-block add-lists todo-inbox-check">
              <label className="checkboxs">
                <input type="checkbox" defaultChecked={true} />
                <span className="checkmarks" />
                Mark all as Complete
              </label>
            </div>
            <div className="form-sort me-2 mb-sm-0 mb-3">
              <i data-feather="sliders" className="info-img" />

              <Select
                className="select"
                styles={customStyles}
                options={lastModified}
                placeholder="Sort by Date"
              />
            </div>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-added"
                data-bs-toggle="modal"
                data-bs-target="#note-units"
              >
                <i className="feather feather-plus-circle me-2" /> Add Task{" "}
              </Link>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
            <div className="stickybar">
              <div className="notes-dash">
                <div className="notes-top-head">
                  <h5>
                    {" "}
                    <i
                      data-feather="file-text"
                      className="feather-file-text"
                    />{" "}
                    Todo List
                  </h5>
                </div>
                <div className="notes-top-head-submenu">
                  <div
                    className="nav flex-column nav-pills todo-inbox"
                    id="v-pills-tab"
                    role="tablist"
                    aria-orientation="vertical"
                  >
                    <button
                      className="nav-link todo-tab todo-inbox active"
                      id="v-pills-profile-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#v-pills-profile"
                      type="button"
                      role="tab"
                      aria-controls="v-pills-profile"
                      aria-selected="true"
                    >
                      {" "}
                      <i data-feather="inbox" className="feather-inbox" />
                      Inbox <span className="ms-2">1</span>
                    </button>
                    <button
                      className="nav-link todo-tab todo-inbox"
                      id="v-pills-home-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#v-pills-home"
                      type="button"
                      role="tab"
                      aria-controls="v-pills-home"
                      aria-selected="false"
                    >
                      {" "}
                      <i
                        data-feather="check-circle"
                        className="feather-check-circle"
                      />
                      Done
                    </button>
                    <button
                      className="nav-link todo-tab-btn todo-inbox"
                      id="v-pills-messages-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#v-pills-messages"
                      type="button"
                      role="tab"
                      aria-controls="v-pills-messages"
                      aria-selected="false"
                    >
                      {" "}
                      <i data-feather="star" className="feather-star" />{" "}
                      Important
                    </button>
                    <button
                      className="nav-link todo-tab todo-inbox mb-0"
                      id="v-pills-settings-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#v-pills-settings"
                      type="button"
                      role="tab"
                      aria-controls="v-pills-settings"
                      aria-selected="false"
                    >
                      {" "}
                      <i data-feather="trash-2" className="feather-trash-2" />
                      Trash
                    </button>
                  </div>
                </div>
                <div className="content-submenu-tag">
                  <h6>Tags</h6>
                  <ul className="tags-list">
                    <li className="personal">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Pending
                      </Link>
                    </li>
                    <li className="social">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Onhold
                      </Link>
                    </li>
                    <li className="public">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Inprogress
                      </Link>
                    </li>
                    <li className="work">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Done
                      </Link>
                    </li>
                  </ul>
                  <h6>Priority</h6>
                  <ul className="priority-list">
                    <li className="medium">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Medium
                      </Link>
                    </li>
                    <li className="high">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        High
                      </Link>
                    </li>
                    <li className="low">
                      <Link to="#">
                        <span>
                          <i className="fas fa-square" />
                        </span>
                        Low
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-9 budget-role-notes">
            <div className="section-bulk-wrap">
              <div className="bulk-action-type">
                <div className="form-sort select-bluk">
                  <Select
                    options={options}
                    className="select"
                    styles={customStyles}
                  />
                </div>
                <Link to="" className="btn btn-added ">
                  Apply
                </Link>
                <div className="search-set">
                  <div className="search-input">
                    <Link to="" className="btn btn-searchset">
                      <i data-feather="search" className="feather-search" />
                    </Link>
                    <div
                      id="DataTables_Table_0_filter"
                      className="dataTables_filter"
                    >
                      <label>
                        {" "}
                        <input
                          type="search"
                          className="form-control form-control-sm"
                          placeholder="Search"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-sort">
                <i data-feather="filter" className="feather-filter" />
                <Select
                  className="select"
                  styles={customStyles}
                  options={recent}
                  placeholder="Recent"
                />
              </div>
            </div>
            <div className="tab-content" id="v-pills-tabContent">
              <div
                className="tab-pane fade active show"
                id="v-pills-profile"
                role="tabpanel"
                aria-labelledby="v-pills-profile-tab"
              >
                <div className="sections-notes-slider">
                  <div className="row">
                    <div className="col-lg-12">
                      <div
                        className="accordion-card-one accordion todo-accordion"
                        id="accordionExample"
                      >
                        <div className="accordion-item">
                          <div className="accordion-header" id="headingOne">
                            <div
                              className="accordion-button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseOne"
                              aria-controls="collapseOne"
                            >
                              <div className="notes-content todo-today-content">
                                <div className="notes-header todo-today-header">
                                  <span>
                                    <i
                                      data-feather="calendar"
                                      className="feather-calendar"
                                    />
                                  </span>
                                  <h3>Today</h3>
                                  <h6>1</h6>
                                </div>
                              </div>
                              <div className="todo-drop-down">
                                <Link to="#">
                                  <span>
                                    <i className="fas fa-chevron-down" />
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div
                            id="collapseOne"
                            className="accordion-collapse collapse show"
                            aria-labelledby="headingOne"
                            data-bs-parent="#accordionExample"
                          >
                            <div className="accordion-body">
                              <div className="todo-widget">
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content">
                                      <h4>Meeting with Shaun Park at 4:50pm</h4>
                                      <p>Discuss about new project</p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> High
                                    </p>
                                    <p className="badge bg-outline-secondary badge-lg me-2 mb-0">
                                      {" "}
                                      New
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <ImageWithBasePath
                                      src="./assets/img/users/user-24.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="accordion-card-one accordion todo-accordion"
                        id="accordionExample2"
                      >
                        <div className="accordion-item">
                          <div className="accordion-header" id="headingTwo">
                            <div
                              className="accordion-button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseTwo"
                              aria-controls="collapseTwo"
                            >
                              <div className="notes-content todo-today-content">
                                <div className="notes-header todo-today-header">
                                  <span>
                                    <i
                                      data-feather="calendar"
                                      className="feather-calendar"
                                    />
                                  </span>
                                  <h3>Yesterday</h3>
                                </div>
                                <div className="todo-drop-down">
                                  <Link to="#">
                                    <span>
                                      <i className="fas fa-chevron-down" />
                                    </span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            id="collapseTwo"
                            className="accordion-collapse collapse show"
                            aria-labelledby="headingTwo"
                            data-bs-parent="#accordionExample2"
                          >
                            <div className="accordion-body">
                              <div className="todo-widget">
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content">
                                      <h4>Team meet at Starbucks</h4>
                                      <p>Identify the implementation team</p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> High
                                    </p>
                                    <p className="badge bg-outline-info badge-lg me-2 mb-0">
                                      {" "}
                                      Pending
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <Link
                                      to="#"
                                      className="todo-star star-todo-inbox"
                                    >
                                      <span>
                                        <i
                                          data-feather="star"
                                          className="feather-star me-3"
                                        />
                                      </span>
                                    </Link>
                                    <ImageWithBasePath
                                      src="assets/img/profiles/avatar-02.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content">
                                      <h4>
                                        Meet Lisa to discuss project details
                                      </h4>
                                      <p>Discuss about additional features</p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-secondary badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> Medium
                                    </p>
                                    <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                                      {" "}
                                      InProgress
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <ImageWithBasePath
                                      src="./assets/img/users/user-11.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input
                                        type="checkbox"
                                        defaultChecked={true}
                                      />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content todo-strike-content">
                                      <h4>Download Complete</h4>
                                      <p>
                                        Install console machines and prerequiste
                                        softwares
                                      </p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> Low
                                    </p>
                                    <p className="badge bg-outline-success badge-lg me-2 mb-0">
                                      {" "}
                                      Completed
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <ImageWithBasePath
                                      src="./assets/img/users/user-02.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="accordion-card-one accordion todo-accordion"
                        id="accordionExample4"
                      >
                        <div className="accordion-item">
                          <div className="accordion-header" id="headingFour">
                            <div
                              className="accordion-button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseFour"
                              aria-controls="collapseFour"
                            >
                              <div className="notes-content todo-today-content">
                                <div className="notes-header todo-today-header">
                                  <span>
                                    <i
                                      data-feather="calendar"
                                      className="feather-calendar"
                                    />
                                  </span>
                                  <h3>25/07/2023</h3>
                                </div>
                                <div className="todo-drop-down">
                                  <Link to="#">
                                    <span>
                                      <i className="fas fa-chevron-down" />
                                    </span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            id="collapseFour"
                            className="accordion-collapse collapse show"
                            aria-labelledby="headingFour"
                            data-bs-parent="#accordionExample4"
                          >
                            <div className="accordion-body">
                              <div className="todo-widget">
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content">
                                      <h4>New User Registered</h4>
                                      <p>Add new user</p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> High
                                    </p>
                                    <p className="badge bg-outline-info badge-lg me-2 mb-0">
                                      {" "}
                                      Pending
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <ImageWithBasePath
                                      src="./assets/img/users/user-25.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="todo-wrapper-list">
                                  <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                                    <label className="checkboxs">
                                      <input type="checkbox" />
                                      <span className="checkmarks" />
                                    </label>
                                    <div className="todo-wrapper-list-content">
                                      <h4>Fix issues in new project</h4>
                                      <p>Unit test had done and bug fixed</p>
                                    </div>
                                  </div>
                                  <div className="notes-card-body d-flex align-items-center">
                                    <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                                      <i className="fas fa-circle" /> High
                                    </p>
                                    <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                                      {" "}
                                      InProgress
                                    </p>
                                  </div>
                                  <div className=" todo-profile d-flex align-items-center">
                                    <ImageWithBasePath
                                      src="./assets/img/users/user-04.jpg"
                                      alt="Img"
                                      className="img-fluid"
                                    />
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-note-units"
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete-note-units"
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link to="#" className="dropdown-item">
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-note-units"
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
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
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade "
                id="v-pills-home"
                role="tabpanel"
                aria-labelledby="v-pills-home-tab"
              >
                <div className="sections-notes-slider">
                  <div className="row">
                    <div className="todo-widget">
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Team meet at Starbucks</h4>
                            <p>Identify the implementation team</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> High
                          </p>
                          <p className="badge bg-outline-info badge-lg me-2 mb-0">
                            {" "}
                            Pending
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-03.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Meet Lisa to discuss project details</h4>
                            <p>Discuss about additional features</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-secondary badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> Medium
                          </p>
                          <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                            {" "}
                            InProgress
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-04.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs active">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content todo-strike-content">
                            <h4>Download Complete</h4>
                            <p>
                              Install console machines and prerequiste softwares
                            </p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> Low
                          </p>
                          <p className="badge bg-outline-success badge-lg me-2 mb-0">
                            {" "}
                            Completed
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-05.jpg"
                            alt="Img"
                            className="img-fluid me-0"
                          />
                          <Link to="#" className="inbox-call-profile">
                            Calls
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="v-pills-messages"
                role="tabpanel"
                aria-labelledby="v-pills-messages-tab"
              >
                <div className="sections-notes-slider">
                  <div className="row">
                    <div className="todo-widget">
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Team meet at Starbucks</h4>
                            <p>Identify the implementation team</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> High
                          </p>
                          <p className="badge bg-outline-info badge-lg me-2 mb-0">
                            {" "}
                            Pending
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <Link to="#" className="todo-star">
                            <span>
                              <i className="fas fa-star me-3" />
                            </span>
                          </Link>
                          <ImageWithBasePath
                            src="./assets/img/users/user-05.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Meet Lisa to discuss project details</h4>
                            <p>Discuss about additional features</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-secondary badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> Medium
                          </p>
                          <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                            {" "}
                            InProgress
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-06.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs active">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content todo-strike-content">
                            <h4>Download Complete</h4>
                            <p>
                              Install console machines and prerequiste softwares
                            </p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> Low
                          </p>
                          <p className="badge bg-outline-success badge-lg me-2 mb-0">
                            {" "}
                            Completed
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-07.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-note-units"
                            >
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Edit
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-note-units"
                            >
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="star" />
                              </span>
                              Not Important
                            </Link>
                            <Link
                              to="#"
                              className="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#view-note-units"
                            >
                              <span>
                                <i data-feather="eye" />
                              </span>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="v-pills-settings"
                role="tabpanel"
                aria-labelledby="v-pills-settings-tab"
              >
                <div className="sections-notes-slider">
                  <div className="row">
                    <div className="todo-widget">
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Team meet at Starbucks</h4>
                            <p>Identify the implementation team</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-danger badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> High
                          </p>
                          <p className="badge bg-outline-info badge-lg me-2 mb-0">
                            {" "}
                            Pending
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-08.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Permanent Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Restore Task
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="todo-wrapper-list">
                        <div className="input-block add-lists todo-inbox-check todo-inbox-check-list">
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                          <div className="todo-wrapper-list-content">
                            <h4>Meet Lisa to discuss project details</h4>
                            <p>Discuss about additional features</p>
                          </div>
                        </div>
                        <div className="notes-card-body d-flex align-items-center">
                          <p className="badge bg-outline-secondary badge-lg me-2 mb-0">
                            <i className="fas fa-circle" /> Medium
                          </p>
                          <p className="badge bg-outline-warning badge-lg me-2 mb-0">
                            {" "}
                            InProgress
                          </p>
                        </div>
                        <div className=" todo-profile d-flex align-items-center">
                          <ImageWithBasePath
                            src="./assets/img/users/user-09.jpg"
                            alt="Img"
                            className="img-fluid"
                          />
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </Link>
                          <div className="dropdown-menu notes-menu dropdown-menu-end">
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="edit" />
                              </span>
                              Permanent Delete
                            </Link>
                            <Link to="#" className="dropdown-item">
                              <span>
                                <i data-feather="trash-2" />
                              </span>
                              Restore Task
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row custom-pagination">
              <div className="col-md-12">
                <div className="paginations d-flex justify-content-end">
                  <span>
                    <i className="fas fa-chevron-left" />
                  </span>
                  <ul className="d-flex align-items-center page-wrap">
                    <li>
                      <Link to="#" className="active">
                        1
                      </Link>
                    </li>
                    <li>
                      <Link to="#">2</Link>
                    </li>
                    <li>
                      <Link to="#">3</Link>
                    </li>
                    <li>
                      <Link to="#">4</Link>
                    </li>
                  </ul>
                  <span>
                    <i className="fas fa-chevron-right" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TodoModal />
    </div>
  );
};

export default Todo;
