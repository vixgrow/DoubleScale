import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Select, { StylesConfig } from 'react-select';
import { all_routes } from '../router/all_routes';
import CollapseHeader from '../../core/common/collapse-header';
const route = all_routes;

const Membershipplan = () => {
    const [adduser, setAdduser] = useState(false);
    const togglePopup = () => {
        setAdduser(!adduser);
      };
     
  const options1 = [
    { value: 'Choose', label: 'Choose' },
    { value: 'Basic', label: 'Basic' },
    { value: 'Business', label: 'Business' },
    { value: 'Enterprise', label: 'Enterprise' }
  ];

  const options2 = [
    { value: 'Choose', label: 'Choose' },
    { value: '$50', label: '$50' },
    { value: '$200', label: '$200' },
    { value: '$400', label: '$400' },
  ];
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
    {/* Page Wrapper */}
    <div className="page-wrapper">
        <div className="content">
        <div className="row">
            <div className="col-md-12">
            {/* Page Header */}
            <div className="page-header">
                <div className="row align-items-center">
                <div className="col-8">
                    <h4 className="page-title">Membership Plans</h4>
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
                <div className="card-body pb-0">
                {/* Search */}
                <div className="search-section mb-0 border-0">
                    <div className="row">
                    <div className="col-md-5 col-sm-4">
                        <div className="form-wrap icon-form">
                        <span className="form-icon">
                            <i className="ti ti-search" />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search Membership"
                        />
                        </div>
                    </div>
                    <div className="col-md-7 col-sm-8">
                        <div className="export-list text-sm-end">
                        <ul>
                            <li>
                            <Link
                                to="#"
                                className="btn btn-primary add-popup"
                                onClick={togglePopup}
                            >
                                <i className="ti ti-square-rounded-plus" />
                                Add Membership
                            </Link>
                            </li>
                        </ul>
                        </div>
                    </div>
                    </div>
                </div>
                {/* /Search */}
                </div>
            </div>
            <div className="membership-plans">
                <div className="plan-selected">
                <h4>Monthly</h4>
                <div className="status-toggle">
                    <input id="two_factor" className="check" type="checkbox" />
                    <label htmlFor="two_factor" className="checktoggle">
                    checkbox
                    </label>
                </div>
                <h4>Annually</h4>
                </div>
                <div className="row justify-content-center">
                <div className="col-lg-4 col-md-6">
                    <div className="membership-plan-grid">
                    <div className="plan-price-head">
                        <span className="plan-type">Basic</span>
                        <h4>
                        $50 <span>/ month</span>
                        </h4>
                    </div>
                    <div className="Plan-body">
                        <div className="plans-features">
                        <ul>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            10 Contacts
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            10 Leads
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            20 Companies
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            50 Compaigns
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            100 Projects
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Deals
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Tasks
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Pipelines
                            </li>
                        </ul>
                        </div>
                        <div className="plan-btn text-center">
                        <Link to="" className="btn btn-primary">
                            Choose
                        </Link>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="col-lg-4 col-md-6">
                    <div className="membership-plan-grid active">
                    <div className="plan-price-head">
                        <span className="plan-type">Business</span>
                        <h4>
                        $200 <span>/ month</span>
                        </h4>
                    </div>
                    <div className="Plan-body">
                        <div className="plans-features">
                        <ul>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            20 Contacts
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            20 Leads
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            50 Companies
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Compaigns
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Projects
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Deals
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Tasks
                            </li>
                            <li>
                            <span className="bg-danger">
                                <i className="ti ti-x" />
                            </span>
                            Pipelines
                            </li>
                        </ul>
                        </div>
                        <div className="plan-btn text-center">
                        <Link to="" className="btn btn-primary">
                            Choose
                        </Link>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="col-lg-4 col-md-6">
                    <div className="membership-plan-grid">
                    <div className="plan-price-head">
                        <span className="plan-type">Enterprise</span>
                        <h4>
                        $400 <span>/ month</span>
                        </h4>
                    </div>
                    <div className="Plan-body">
                        <div className="plans-features">
                        <ul>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Contacts
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Leads
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Companies
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Compaigns
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Unlimited Projects
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Deals
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Tasks
                            </li>
                            <li>
                            <span>
                                <i className="ti ti-check" />
                            </span>
                            Pipelines
                            </li>
                        </ul>
                        </div>
                        <div className="plan-btn text-center">
                        <Link to="" className="btn btn-primary">
                            Choose
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
    {/* /Page Wrapper */}
    {/* Add Plan */}
    <div className={`toggle-popup ${adduser ? "sidebar-popup":""}`}>
        <div className="sidebar-layout">
        <div className="sidebar-header">
            <h4>Add New Plan</h4>
            <Link to="#" className="sidebar-close toggle-btn" onClick={togglePopup}>
            <i className="ti ti-x" />
            </Link>
        </div>
        <div className="toggle-body">
            <div className="pro-create">
            <form>
                <div className="accordion-lists" id="list-accord">
                {/* Basic Info */}
                <div className="manage-user-modal">
                    <div className="manage-user-modals">
                    <div className="row">
                        <div className="col-md-12">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            {" "}
                            Plan Name <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Plan Type <span className="text-danger">*</span>
                            </label>
                            <Select styles={customStyles} className="select" options={options1} />
                        
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <div className="d-flex justify-content-between align-items-center">
                            <label className="col-form-label">
                                Plan Price <span className="text-danger">*</span>
                            </label>
                            <span className="text-danger">
                                <i className="ti ti-info-circle me-2" />
                                Set 0 for free
                            </span>
                            </div>
                            <Select styles={customStyles} className="select" options={options2} />

                          
                        </div>
                        </div>
                        <div className="col-md-12">
                        <h5 className="mb-3">Plan Settings</h5>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Contacts <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-1"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-1" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Leads <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-2"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-2" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Companies <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-3"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-3" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Compaigns <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-4"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-4" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Projects <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-5"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-5" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Deals <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-6"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-6" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Tasks <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-7"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-7" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-wrap">
                            <label className="col-form-label">
                            Pipelines <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control"
                                defaultValue="0-100"
                            />
                            <div className="status-toggle ms-3">
                                <input
                                id="mem-tog-8"
                                className="check"
                                type="checkbox"
                                />
                                <label htmlFor="mem-tog-8" className="checktoggle">
                                checkbox
                                </label>
                            </div>
                            </div>
                            <label className="checkboxs mt-2">
                            <input type="checkbox" />
                            <span className="checkmarks mem-plane-check" />
                            Unlimited
                            </label>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                {/* /Basic Info */}
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
    </div>
    {/* /Add Plan */}
    </>
  )
}

export default Membershipplan
