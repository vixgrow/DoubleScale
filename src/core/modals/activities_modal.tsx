import React from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { useSelector, useDispatch } from "react-redux";
import {
  setActivityTogglePopup,
  setActivityTogglePopupTwo,
} from "../data/redux/commonSlice";
import DefaultEditor from "react-simple-wysiwyg";
import { all_routes } from "../../feature-module/router/all_routes";
import { TimePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { customStyles } from "../common/selectoption/selectoption";

const route = all_routes;
interface OptionType {
  value: string;
  label: string;
  image: string;
}

const ActivitiesModal = () => {
  dayjs.extend(customParseFormat);
  const onChange = (time: Dayjs, timeString: any) => {
    console.log(time, timeString);
  };

  const options: OptionType[] = [
    {
      value: "Darlee Robertson",
      label: "Darlee Robertson",
      image: "assets/img/profiles/avatar-19.jpg",
    },
    {
      value: "Sharon Roy",
      label: "Sharon Roy",
      image: "assets/img/profiles/avatar-20.jpg",
    },
    {
      value: "Vaughan",
      label: "Vaughan",
      image: "assets/img/profiles/avatar-21.jpg",
    },
    {
      value: "Jessica",
      label: "Jessica",
      image: "assets/img/profiles/avatar-23.jpg",
    },
    {
      value: "Carol Thomas",
      label: "Carol Thomas",
      image: "assets/img/profiles/avatar-16.jpg",
    },
  ];

  const activityToggle = useSelector(
    (state: any) => state?.activityTogglePopup
  );
  const activityToggleTwo = useSelector(
    (state: any) => state?.activityTogglePopupTwo
  );
  const dispatch = useDispatch();

  const options1 = [
    { value: "select", label: "Select" },
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
  ];

  const options2 = [
    { value: "select", label: "Select" },
    { value: "hendry", label: "Hendry" },
    { value: "bradtke", label: "Bradtke" },
    { value: "sally", label: "Sally" },
  ];

  const options3 = [
    { value: "select", label: "Select" },
    { value: "collins", label: "Collins" },
    { value: "konopelski", label: "Konopelski" },
    { value: "adams", label: "Adams" },
  ];

  const options4 = [
    { value: "select", label: "Select" },
    { value: "novawave", label: "NovaWave LLC" },
    { value: "silverhawk", label: "SilverHawk" },
    { value: "harborview", label: "HarborView" },
  ];

  return (
    <>
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
                              defaultChecked
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
                        <Select className="select" options={options1} styles={customStyles}/>
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
                      <Select className="select" options={options2} styles={customStyles}/>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Guests <span className="text-danger">*</span>
                      </label>
                      <Select
                        options={options}
                        isMulti
                        getOptionLabel={(option) =>
                          `${option.label} (${option.value})`
                        }
                        getOptionValue={(option) => option.value}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-wrap">
                      <label className="col-form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      {/* <div className="summernote" /> */}
                      <DefaultEditor className="summernote" />
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
                      <Select className="select" options={options3} styles={customStyles}/>
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
                      <Select className="select" options={options3} styles={customStyles}/>
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
                      <Select className="select" options={options4} styles={customStyles}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="submit-button text-end">
                <Link
                  to="#"
                  className="btn btn-light sidebar-close"
                  onClick={() =>
                    dispatch(setActivityTogglePopup(!activityToggle))
                  }
                >
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
      <div
        className={
          activityToggleTwo ? "toggle-popup1 sidebar-popup" : "toggle-popup1"
        }
      >
        <div className="sidebar-layout">
          <div className="sidebar-header">
            <div>
              <h4 className="mb-1">We scheduled a meeting for next week</h4>
              <p>Created At: September 28, 2023 01:21 - Hendry</p>
            </div>
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
                                  defaultChecked
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
                            <Select className="select" options={options1} styles={customStyles}/>
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
                          <Select className="select" options={options2} styles={customStyles}/>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Guests <span className="text-danger">*</span>
                          </label>
                          <Select
                            options={options}
                            isMulti
                            getOptionLabel={(option) =>
                              `${option.label} (${option.value})`
                            }
                            getOptionValue={(option) => option.value}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="form-wrap">
                          <label className="col-form-label">
                            Description <span className="text-danger">*</span>
                          </label>
                          {/* <div className="summernote" /> */}
                          <DefaultEditor className="summernote" />
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
                          <Select className="select" options={options3} styles={customStyles}/>
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
                          <Select className="select" options={options3} styles={customStyles}/>
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
                          <Select className="select" options={options4} styles={customStyles}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="submit-button text-end">
                <Link
                  to="#"
                  className="btn btn-light sidebar-close1"
                  onClick={() =>
                    dispatch(setActivityTogglePopupTwo(!activityToggleTwo))
                  }
                >
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
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
      {/* Add Contacts */}
      <div className="modal custom-modal fade" id="add_contacts" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Contacts</h5>
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
                          <img
                            src="assets/img/profiles/avatar-19.jpg"
                            alt="img"
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
                          <img
                            src="assets/img/profiles/avatar-20.jpg"
                            alt="img"
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
                          <img
                            src="assets/img/profiles/avatar-21.jpg"
                            alt="img"
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
                          <img
                            src="assets/img/profiles/avatar-01.jpg"
                            alt="img"
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
                          <img
                            src="assets/img/profiles/avatar-16.jpg"
                            alt="img"
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
                          <img
                            src="assets/img/profiles/avatar-22.jpg"
                            alt="img"
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
                  <button type="submit" className="btn btn-primary">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Contacts */}
      {/* Add Deals */}
      <div className="modal custom-modal fade" id="add_deal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Deals</h5>
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
                          <Link to="#">Collins</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <Link to="#">Konopelski</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <Link to="#">Adams</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <Link to="#">Schumm</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <Link to="#">Wisozk</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
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
                  <button type="submit" className="btn btn-primary">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Deals */}
      {/* Add Company */}
      <div className="modal custom-modal fade" id="add_company" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Company</h5>
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
                          <img
                            src="assets/img/icons/company-icon-01.svg"
                            alt="img"
                          />
                          <Link to="#">NovaWave LLC</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <img
                            src="assets/img/icons/company-icon-02.svg"
                            alt="img"
                          />
                          <Link to="#">BlueSky Industries</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <img
                            src="assets/img/icons/company-icon-03.svg"
                            alt="img"
                          />
                          <Link to="#">SilverHawk</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <img
                            src="assets/img/icons/company-icon-04.svg"
                            alt="img"
                          />
                          <Link to="#">SummitPeak</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <img
                            src="assets/img/icons/company-icon-05.svg"
                            alt="img"
                          />
                          <Link to="#">RiverStone Ventur</Link>
                        </span>
                      </label>
                    </li>
                    <li className="select-people-checkbox">
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                        <span className="people-profile">
                          <img
                            src="assets/img/icons/company-icon-06.svg"
                            alt="img"
                          />
                          <Link to="#">Bright Bridge Grp</Link>
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
                  <button type="submit" className="btn btn-primary">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Company */}
    </>
  );
};

export default ActivitiesModal;
