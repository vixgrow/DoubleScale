import React, { useState } from "react";
import { Link } from "react-router-dom";
import Table from "../../../core/common/dataTable/index";
import Select , { StylesConfig }from "react-select";
import DateRangePicker from "react-bootstrap-daterangepicker";
import "bootstrap-daterangepicker/daterangepicker.css";
import {
  countryoptions1,
  languageOptions,
  optiondeals,
  optionindustry,
  options,
  options1,
  optionschoose,
  optionsource,
  optionsowner,
  optionsowner1,
  optionssymbol,
} from "../../../core/common/selectoption/selectoption";
import { leadsData } from "../../../core/data/json/leads";
import { TableData } from "../../../core/data/interface";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CollapseHeader from "../../../core/common/collapse-header";
import { SelectWithImage } from "../../../core/common/selectWithImage";
import { SelectWithImage2 } from "../../../core/common/selectWithImage2";

interface LostReason {
  key: string;
  title: string;
  createdAt: string;
  status: string;
}

const LeadsKanban = () => {
  const [adduser, setAdduser] = useState(false);
  const [addcompany, setAddCompany] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add New Lead");
  const data = leadsData;
  const togglePopup = (isEditing:any) => {
    setModalTitle(isEditing ? "Edit Lead" : "Add New Lead");
    setAdduser(!adduser);
  };
  const addcompanyPopup = () => {
    setAddCompany(!addcompany);
  };

  const customStyles: StylesConfig = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#E41F07" : "#fff",
      color: state.isFocused ? "#fff" : "#000",
      "&:hover": {
        backgroundColor: "#E41F07",
      },
    }),
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
                    <div className="col-4">
                    <h4 className="page-title">
                        Leads<span className="count-title">123</span>
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
                        <div className="filter-dropdown-menu dropdown-menu dropdown-menu-start">
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
                                      className="select"
                                      options={options1}
                                      styles={customStyles}
                                    />
                                <div className="radio-btn-items">
                                <div className="radio-btn">
                                    <input
                                    type="radio"
                                    className="status-radio"
                                    id="pdf"
                                    name="export-type"
                                    defaultChecked
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
                                    Lead Name
                                    </Link>
                                </div>
                                <div
                                    className="filter-set-contents accordion-collapse collapse show"
                                    id="collapseTwo"
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
                                            <h5>Schumm</h5>
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
                                            <h5>Wisozk</h5>
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
                                            <h5>Heller</h5>
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
                                    data-bs-target="#company"
                                    aria-expanded="false"
                                    aria-controls="company"
                                    >
                                    Company Name
                                    </Link>
                                </div>
                                <div
                                    className="filter-set-contents accordion-collapse collapse"
                                    id="company"
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
                                        placeholder="Search Company"
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
                                            <h5>NovaWave LLC</h5>
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
                                            <h5>BlueSky Industries</h5>
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
                                            <h5>SilverHawk</h5>
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
                                            <h5>SummitPeak</h5>
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
                                            <h5>RiverStone Ventur</h5>
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
                                    Lead Status
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
                                            <h5>Closed</h5>
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
                                            <h5>Not Contacted</h5>
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
                                            <h5>Contacted</h5>
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
                                    data-bs-target="#date"
                                    aria-expanded="false"
                                    aria-controls="date"
                                    >
                                    Created Date
                                    </Link>
                                </div>
                                <div
                                    className="filter-set-contents accordion-collapse collapse"
                                    id="date"
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
                                            <h5>25 Sep 2023, 01:22 pm</h5>
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
                                            <h5>29 Sep 2023, 04:15 pm</h5>
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
                                            <h5>04 Oct 2023, 10:18 am</h5>
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
                                    Lead Owner
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
                            </div>
                            <div className="filter-reset-btns">
                                <div className="row">
                                <div className="col-6">
                                    <Link to="#" className="btn btn-light">
                                    Reset
                                    </Link>
                                </div>
                                <div className="col-6">
                                    <Link to="/leads" className="btn btn-primary">
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
                            placeholder="Search Leads"
                        />
                        </div>
                    </li>
                    </ul>
                </div>
                <div className="filter-list">
                    <ul>
                    <li>
                        <div className="view-icons">
                        <Link to="/leads">
                            <i className="ti ti-list-tree" />
                        </Link>
                        <Link to="/leads-kanban" className="active">
                            <i className="ti ti-grid-dots" />
                        </Link>
                        </div>
                    </li>
                    <li>
                        <Link
                        onClick={() => togglePopup(false)}
                        to="#"
                        className="btn btn-primary add-popup"
                        >
                        <i className="ti ti-square-rounded-plus" />
                        Add Leads
                        </Link>
                    </li>
                    </ul>
                </div>
                </div>
                {/* /Filter */}
                {/* Leads Kanban */}
                <div className="kanban-wrapper leads-kanban-wrapper">
                <div className="kanban-list-items">
                    <div className="kanban-list-head">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="kanban-title-head dot-warning">
                        <h5>Contacted</h5>
                        <span>45 Leads - $15,44,540</span>
                        </div>
                        <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn add-popup" onClick={()=>togglePopup(false)}>
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
                            <Link className="dropdown-item edit-popup" to="#" onClick={() => togglePopup(true)}>
                                <i className="fa-solid fa-pencil text-blue" /> Edit
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
                            <Link to="/leads-details">
                                <span>SM</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Schumm</Link>
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
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-09.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>CS</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Collins</Link>
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
                                robertson@example.com
                            </li>
                            <li>
                                <i className="ti ti-phone" />
                                +1 13987-90231
                            </li>
                            <li>
                                <i className="ti ti-map-pin-pin" />
                                Austin, United States
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-01.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>KI</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Konopelski</Link>
                            </h6>
                            </div>
                        </div>
                        <div className="kanban-card-body">
                            <ul>
                            <li>
                                <i className="ti ti-report-money" />
                                $02,18,000
                            </li>
                            <li>
                                <i className="ti ti-mail" />
                                sharon@example.com
                            </li>
                            <li>
                                <i className="ti ti-phone" />
                                +1 17932-04278
                            </li>
                            <li>
                                <i className="ti ti-map-pin-pin" />
                                Atlanta, United States
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-02.svg" alt="" />
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
                        <h5>Not Contacted</h5>
                        <span>45 Leads - $15,44,540</span>
                        </div>
                        <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn add-popup" onClick={()=>togglePopup(false)}>
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
                            <Link className="dropdown-item edit-popup" to="#" onClick={() => togglePopup(true)}>
                                <i className="fa-solid fa-pencil text-blue" /> Edit
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
                            <Link to="/leads-details">
                                <span>AS</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Adams</Link>
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
                                vaughan12@example.com
                            </li>
                            <li>
                                <i className="ti ti-phone" />
                                +1 17392-27846
                            </li>
                            <li>
                                <i className="ti ti-map-pin-pin" />
                                London, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-03.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>WK</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Wizosk</Link>
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
                                Bristol, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-04.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>HR</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Heller</Link>
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
                                San Francisco, United States
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-05.svg" alt="" />
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
                        <div className="kanban-title-head dot-success">
                        <h5>Closed</h5>
                        <span>45 Leads - $15,44,540</span>
                        </div>
                        <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn add-popup" onClick={()=>togglePopup(false)}>
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
                            <Link className="dropdown-item edit-popup" to="#" onClick={() => togglePopup(true)}>
                                <i className="fa-solid fa-pencil text-blue" /> Edit
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
                            <Link to="/leads-details">
                                <span>GI</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Gutkowsi</Link>
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
                                Dallas, United States
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-06.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>WR</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Walter</Link>
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
                                Leicester, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-07.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>HN</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Hansen</Link>
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
                                Norwich, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-08.svg" alt="" />
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
                        <div className="kanban-title-head dot-danger">
                        <h5>Lost</h5>
                        <span>15 Leads - $14,89,543</span>
                        </div>
                        <div className="kanban-action-btns d-flex align-items-center">
                        <Link to="#" className="plus-btn add-popup" onClick={()=>togglePopup(false)}>
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
                            <Link className="dropdown-item edit-popup" to="#" onClick={() => togglePopup(true)}>
                                <i className="fa-solid fa-pencil text-blue" /> Edit
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
                            <Link to="/leads-details">
                                <span>SE</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Steve</Link>
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
                                Manchester, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-09.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>LE</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Leuschke</Link>
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
                                Chicago, United States
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-10.svg" alt="" />
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
                            <Link to="/leads-details">
                                <span>AY</span>
                            </Link>
                            <h6>
                                <Link to="/leads-details">Anthony</Link>
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
                                Derby, United Kingdom
                            </li>
                            </ul>
                        </div>
                        <div className="kanban-card-footer d-flex align-items-center justify-content-between">
                            <span>
                            <ImageWithBasePath src="assets/img/icons/company-icon-01.svg" alt="" />
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
                {/* /Leads Kanban */}
            </div>
            </div>
        </div>
        </div>

        {/* /Page Wrapper */}
        {/* Add User */}
        <div className={`toggle-popup ${adduser ? "sidebar-popup" : ""}`}>
          <div className="sidebar-layout">
            <div className="sidebar-header">
              <h4>{modalTitle}</h4>
              <Link
                to="#"
                className="sidebar-close toggle-btn"
                onClick={togglePopup}
              >
                <i className="ti ti-x" />
              </Link>
            </div>
            <div className="toggle-body">
              <div className="pro-create">
                <form >
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Lead Name <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-wrap">
                        <div className="radio-wrap">
                          <label className="col-form-label">Lead Type</label>
                          <div className="d-flex flex-wrap">
                            <div className="radio-btn">
                              <input
                                type="radio"
                                className="status-radio"
                                id="person"
                                name="leave"
                                defaultChecked
                              />
                              <label htmlFor="person">Person</label>
                            </div>
                            <div className="radio-btn">
                              <input
                                type="radio"
                                className="status-radio"
                                id="org"
                                name="leave"
                              />
                              <label htmlFor="org">Organization</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-wrap">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="col-form-label">
                            Company <span className="text-danger">*</span>
                          </label>
                          <Link
                            to="#"
                            className="add-new add-new-company add-popups"
                            onClick={addcompanyPopup}
                          >
                            <i className="ti ti-square-rounded-plus me-2" />
                            Add New
                          </Link>
                        </div>
                        <Select className="select" options={options} styles={customStyles}/>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Value <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Currency <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={optionssymbol} styles={customStyles}/>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="row">
                        <div className="col-md-8">
                          <div className="form-wrap">
                            <label className="col-form-label">
                              Phone <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-md-4 d-flex align-items-center">
                          <div className="form-wrap w-100">
                            <Select
                              className="select"
                              options={optionschoose}
                              styles={customStyles}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Source <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={optionsource}styles={customStyles} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Industry <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={optionindustry} styles={customStyles}/>
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
                        <input
                          className="input-tags form-control"
                          type="text"
                          data-role="tagsinput"
                          name="Label"
                          defaultValue="Rated"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={5}
                          defaultValue={""}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="radio-wrap form-wrap">
                        <label className="col-form-label">Visibility</label>
                        <div className="d-flex flex-wrap">
                          <div className="radio-btn">
                            <input
                              type="radio"
                              className="status-radio"
                              id="public1"
                              name="visible"
                            />
                            <label htmlFor="public1">Public</label>
                          </div>
                          <div className="radio-btn">
                            <input
                              type="radio"
                              className="status-radio"
                              id="private1"
                              name="visible"
                            />
                            <label htmlFor="private1">Private</label>
                          </div>
                          <div
                            className="radio-btn"
                            data-bs-toggle="modal"
                            data-bs-target="#access_view"
                          >
                            <input
                              type="radio"
                              className="status-radio"
                              id="people1"
                              name="visible"
                            />
                            <label htmlFor="people1">Select People</label>
                          </div>
                        </div>
                      </div>
                      <div className="radio-wrap form-wrap">
                        <label className="col-form-label">Status</label>
                        <div className="d-flex flex-wrap">
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
                  </div>
                  <div className="submit-button text-end">
                    <Link to="#" className="btn btn-light sidebar-close">
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
        {/* /Add User */}
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
                    <button type="submit" className="btn btn-danger">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className={`toggle-popup2 ${addcompany ? "sidebar-popup" : ""}`}>
          <div className="sidebar-layout">
            <div className="sidebar-header">
              <h4>Add New Company</h4>
              <Link
                to="#"
                className="sidebar-close2 toggle-btn"
                onClick={addcompanyPopup}
              >
                <i className="ti ti-x" />
              </Link>
            </div>
            <div className="toggle-body">
              <div className="pro-create">
                <form>
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
                                      <input
                                        type="file"
                                        className="input-img"
                                      />
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
                                      defaultChecked
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
                                <label className="col-form-label">
                                  Phone 2
                                </label>
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
                                <label className="col-form-label">
                                  Ratings
                                </label>
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
                                <SelectWithImage />
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
                                  <label className="col-form-label">
                                    Deals
                                  </label>
                                </div>
                                <Select
                                  className="select2"
                                  options={optiondeals}
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
                                  options={optionsource}
                                  styles={customStyles}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Industry{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <Select
                                  className="select2"
                                  options={optionindustry}
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
                                  Currency{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Language{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <Select
                                  className="select"
                                  options={languageOptions}
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
                                <label className="col-form-label">
                                  Country
                                </label>
                                <Select
                                  className="select"
                                  options={countryoptions1}
                                  styles={customStyles}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap mb-wrap">
                                <label className="col-form-label">
                                  Zipcode{" "}
                                </label>
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
                                <label className="col-form-label">
                                  Facebook
                                </label>
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
                                <label className="col-form-label">
                                  Twitter
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-wrap mb-wrap">
                                <label className="col-form-label">
                                  Whatsapp
                                </label>
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
                                    <label htmlFor="people">
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
                                      id="active"
                                      name="status"
                                      defaultChecked
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
                  <div className="submit-button text-end">
                    <Link to="#" className="btn btn-light sidebar-close2">
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
        <div className="modal custom-modal fade" id="delete_contact" role="dialog">
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
                <h3>Remove Leads?</h3>
                <p className="del-info">
                  Are you sure you want to remove lead you selected.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to="leads" className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal custom-modal fade" id="delete_deal" role="dialog">
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
                <h3>Remove Leads?</h3>
                <p className="del-info">
                  Are you sure you want to remove lead you selected.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to="/leads" className="btn btn-danger">
                    Yes, Delete it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    </>
  );
};

export default LeadsKanban;
