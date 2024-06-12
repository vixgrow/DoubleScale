import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { pagesData } from '../../../core/data/json/pagesData'
import Table from '../../../core/common/dataTable/index';
import { useDispatch, useSelector } from 'react-redux';
import { setActivityTogglePopup, setActivityTogglePopupTwo, setModalTitle } from '../../../core/data/redux/commonSlice';
import { customStyles, initialSettings, options1 } from '../../../core/common/selectoption/selectoption';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import Select from 'react-select';
import { faqData } from '../../../core/data/json/faq';
import { TableData } from '../../../core/data/interface';
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header';
const route = all_routes;

const Faq = () => {
    const data = faqData;
    const dispatch = useDispatch();
    const [title,setTitle]=useState("Add FAQ")
    const [stars, setStars] = useState<{ [key: number]: boolean }>({}); // State for star toggles
    const togglePopup = (isEditing:any) => {
        setTitle(isEditing ? "Edit FAQ" : "Add FAQ");
    
      };
    // Initialize stars state for each row
    const initializeStarsState = () => {
        const starsState: { [key: number]: boolean } = {};
        faqData.forEach((item, index) => {
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
            title: "Questions",
            dataIndex: "questions",
            sorter: (a: TableData, b: TableData) => a.questions.length - b.questions.length,
        },
        {
            title: "Category",
            dataIndex: "category",
            sorter: (a: TableData, b: TableData) =>
                a.category.length - b.category.length,
        },
        {
            title: "Answers",
            dataIndex: "answers",
            sorter: (a: TableData, b: TableData) =>
                a.answers.length - b.answers.length,
        },
        {
            title: "Created at",
            dataIndex: "created_at",
            sorter: (a: TableData, b: TableData) =>
                a.created_at.length - b.created_at.length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: string) => (
                <div>
                    {text === "Active" && (
                        <span className="badge badge-pill badge-status bg-success">{text}</span>
                    )}
                </div>
            ),
            sorter: true,
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
                        <Link className="dropdown-item edit-popup" to="#" 
                        data-bs-toggle="modal" data-bs-target="#add_faq"
                         onClick={() => togglePopup(true)}
        
                        >
                            <i className="ti ti-edit text-blue"></i> Edit
                        </Link>
                        <Link className="dropdown-item" to="#" data-bs-toggle="modal" data-bs-target="#delete_page">
                            <i className="ti ti-trash text-danger"></i> Delete
                        </Link>
                    </div>
                </div>
            ),
        },

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
                                    <div className="col-8">
                                        <h4 className="page-title">
                                            FAQ<span className="count-title">123</span>
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
                                                        placeholder="Search FAQ"
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
                                                        <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add_faq"><i className="ti ti-square-rounded-plus" onClick={() => togglePopup(false)}></i>Add FAQ</Link>
                                                          
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
                                                <div className="dropdown-menu  dropdown-menu-xl-end">
                                                <h4>Want to manage datatables?</h4>
                                                <p>
                                                    Please drag and drop your column to reorder your table and
                                                    enable see option as you want.
                                                </p>
                                                <ul>
                                                    <li>
                                                    <p>
                                                        <i className="ti ti-grip-vertical" />
                                                        Questions
                                                    </p>
                                                    <div className="status-toggle">
                                                        <input
                                                        type="checkbox"
                                                        id="col-questions"
                                                        className="check"
                                                        />
                                                        <label htmlFor="col-questions" className="checktoggle" />
                                                    </div>
                                                    </li>
                                                    <li>
                                                    <p>
                                                        <i className="ti ti-grip-vertical" />
                                                        Category
                                                    </p>
                                                    <div className="status-toggle">
                                                        <input
                                                        type="checkbox"
                                                        id="col-category"
                                                        className="check"
                                                        />
                                                        <label htmlFor="col-category" className="checktoggle" />
                                                    </div>
                                                    </li>
                                                    <li>
                                                    <p>
                                                        <i className="ti ti-grip-vertical" />
                                                        Answers
                                                    </p>
                                                    <div className="status-toggle">
                                                        <input type="checkbox" id="col-answers" className="check" />
                                                        <label htmlFor="col-answers" className="checktoggle" />
                                                    </div>
                                                    </li>
                                                    <li>
                                                    <p>
                                                        <i className="ti ti-grip-vertical" />
                                                        Status
                                                    </p>
                                                    <div className="status-toggle">
                                                        <input type="checkbox" id="col-status" className="check" />
                                                        <label htmlFor="col-status" className="checktoggle" />
                                                    </div>
                                                    </li>
                                                    <li>
                                                    <p>
                                                        <i className="ti ti-grip-vertical" />
                                                        Action
                                                    </p>
                                                    <div className="status-toggle">
                                                        <input type="checkbox" id="col-action" className="check" />
                                                        <label htmlFor="col-action" className="checktoggle" />
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
                                    {/* Page List */}
                                    <div className="table-responsive custom-table">
                                        <Table
                                            dataSource={data}
                                            columns={columns}
                                        />
                                    </div>
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            ``                <div className="datatable-length" />
                                        </div>
                                        <div className="col-md-6">
                                            <div className="datatable-paginate" />
                                        </div>
                                    </div>
                                    {/* /Page List */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Page Wrapper */}

            {/* Delete page */}
            <div className="modal custom-modal fade" id="delete_page" role="dialog">
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
                                <h3>Remove FAQ?</h3>
                                <p className="del-info">
                                    Are you sure you want to remove page you selected.
                                </p>
                                <div className="col-lg-12 text-center modal-btn">
                                    <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                                        Cancel
                                    </Link>
                                    <Link to="#" className="btn btn-danger" data-bs-dismiss="modal">
                                        Yes, Delete it
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Delete page */}
            {/* Create Page */}
            <div className="modal custom-modal fade" id="create_page" role="dialog">
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
                                <h3>Page Created Successfully!!!</h3>
                                <p>View the details of contact, created</p>
                                <div className="col-lg-12 text-center modal-btn">
                                    <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                                        Cancel
                                    </Link>
                                    <Link to="#" className="btn btn-primary" data-bs-dismiss="modal">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Create Contact */}
                    
            {/* Add FAQ */}
            <div className="modal custom-modal fade" id="add_faq" role="dialog">
                <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                    <h5 className="modal-title">{title}</h5>
                    <div className="d-flex align-items-center mod-toggle">
                        <button
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                        >
                        <i className="ti ti-x" />
                        </button>
                    </div>
                    </div>
                    <div className="modal-body">
                    <form>
                        <div className="form-wrap">
                        <label className="col-form-label">
                            Category <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                        </div>
                        <div className="form-wrap">
                        <label className="col-form-label">
                            Question <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                        </div>
                        <div className="form-wrap">
                        <label className="col-form-label">
                            Answer <span className="text-danger">*</span>
                        </label>
                        <textarea className="form-control" rows={4} defaultValue={""} />
                        </div>
                        <div className="form-wrap">
                        <label className="col-form-label">
                            Status <span className="text-danger">*</span>
                        </label>
                        <div className="radio-wrap">
                            <div className="d-flex align-items-center">
                            <div className="radio-btn">
                                <input
                                type="radio"
                                className="status-radio"
                                id="active1"
                                name="status"
                                defaultChecked
                                />
                                <label htmlFor="active1">Active</label>
                            </div>
                            <div className="radio-btn">
                                <input
                                type="radio"
                                className="status-radio"
                                id="inactive1"
                                name="status"
                                />
                                <label htmlFor="inactive1">Inactive</label>
                            </div>
                            </div>
                        </div>
                        </div>
                        <div className="modal-btn">
                        <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
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
            {/* /Add FAQ  */}


        </>

    )
}

export default Faq
