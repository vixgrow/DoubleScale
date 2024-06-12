import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Table from '../../core/common/dataTable/index';
import Select from 'react-select';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import NotesContent from './notesContent';
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { PlusCircle, Sliders } from 'react-feather';
import NotesModal from './notesModal';



const Notes = () => {
    const [adduser, setAdduser] = useState(false);
    const [isOpen, setOpen] = useState(false);
    const togglePopup = () => {
        setAdduser(!adduser);
      };
     
      const options = [
        { value: "sortByDate", label: "Sort by Date" },
        { value: "Ascending", label: "Ascending" },
        { value: "Descending", label: "Descending" },
        { value: "Recently Viewed", label: "Recently Viewed" },
        { value: "Recently Added", label: "Recently Added" },
        { value: "Creation Date", label: "Creation Date" },
      ];
  const options1 = [
    { value: 'Select a View', label: 'Select a View' },
    { value: 'Contact View List', label: 'Contact View List' },
    { value: 'Contact Location View', label: 'Contact Location View' }
  ];
  const options2 = [
    { value: 'Choose', label: 'Choose' },
    { value: 'Germany', label: 'Germany' },
    { value: 'USA', label: 'USA' },
    { value: 'Canada', label: 'Canada' },
    { value: 'India', label: 'India' },
    { value: 'China', label: 'China' },

  ];
  
  return (
    <>
    <div className={`page-wrapper notes-page-wrapper ${
        isOpen && "notes-tag-left"
      }`}>
    <div className="content">
        <div className="page-header page-add-notes  flex-sm-row flex-column">
        <div className="add-item d-flex">
            <div className="page-title">
            <h4>Notes</h4>
            <h6 className="mb-0">Manage your notes</h6>
            </div>
            <Link id="toggle_btn2" className="notes-tog" to="#" onClick={() => setOpen(!isOpen)}>
            <i className="fas fa-chevron-left" />
            </Link>
        </div>
        <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <div className="form-sort me-2 mb-sm-0 mb-3">
            <Sliders className="info-img" />
            <Select
                className="select"
                options={options}
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
                <PlusCircle className="me-2" /> Add Note
            </Link>
            </div>
        </div>
        </div>
        <div className="row">
        <div
            className={`col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget  ${
              isOpen && "section-notes-dashboard"
            }`}
          >
            <div className="notes-dash">
            <div className="notes-top-head">
                <h5>
                {" "}
                <i data-feather="file-text" className="feather-file-text" /> Notes
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
                    className="nav-link todo-tab todo-inbox active d-flex align-items-center"
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
                    All Notes
                    <span className="ms-auto">
                    <span>2</span>
                    </span>
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
                    <i data-feather="star" className="feather-star" /> Important
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
        <div   className={`col-xl-9 budget-role-notes  ${
              isOpen && "budgeted-role-notes"
            }`}>
            <NotesContent />
          
        </div>
        </div>
    </div>
    </div>
    <NotesModal />
 
    {/* Delete Unit */}
    <div className="modal fade" id="delete-note-units">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="delete-popup">
                <div className="delete-image text-center mx-auto">
                  <ImageWithBasePath 
                    src="/assets/img/icons/close-circle.png"
                    alt="Img"
                    className="img-fluid"
                  />
                </div>
                <div className="delete-heads">
                  <h4>Are You Sure?</h4>
                  <p>
                    Do you really want to delete this item, This process cannot be
                    undone.
                  </p>
                </div>
                <div className="modal-footer-btn delete-footer">
                  <Link
                    to=""
                    className="btn btn-cancel me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to="" className="btn btn-submit">
                    Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* /Delete Unit */}
    {/* View Unit */}
    <div className="modal fade" id="view-note-units">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title edit-page-title">
                  <h4>Notes</h4>
                  <p>Personal</p>
                </div>
                <div className=" edit-noted-head d-flex align-items-center">
                  <Link to="#">
                    <span>
                      <i data-feather="trash-2" />
                    </span>
                  </Link>
                  <Link to="#" className="me-2">
                    <span>
                      <i data-feather="star" />
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
              <div className="modal-body custom-modal-body">
                <form>
                  <div className="row">
                    <div className="col-12">
                      <div className="edit-head-view">
                        <h6>Take a hike at a local park</h6>
                        <p>
                          Hiking is a long, vigorous walk, usually on trails or
                          footpaths in the countryside. Walking for pleasure
                          developed in Europe during the eighteenth century.
                          Religious pilgrimages have existed much longer but they
                          involve walking long distances for a spiritual purpose
                          associated with specific religions and also we achieve
                          inner peace while we hike at a local park.
                        </p>
                        <p className="badged low">
                          <i className="fas fa-circle" /> Low
                        </p>
                      </div>
                      <div className="modal-footer-btn edit-footer-menu">
                        <button
                          type="button"
                          className="btn btn-cancel me-2"
                          data-bs-dismiss="modal"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* /View Unit */}
    <div className="customizer-links" id="setdata">
      <ul className="sticky-sidebar">
        <li className="sidebar-icons">
          <Link
            to="#"
            className="navigation-add"
            data-bs-toggle="tooltip"
            data-bs-placement="left"
            data-bs-original-title="Theme"
          >
            <i data-feather="settings" className="feather-five" />
          </Link>
        </li>
      </ul>
    </div>
  </>
  
  )
}

export default Notes
