import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom'
import Select, { StylesConfig } from 'react-select'
import { setActivityTogglePopup, setActivityTogglePopupTwo } from '../data/redux/commonSlice';

const CompaignComplete = () => {
    const dispatch = useDispatch();
    const activityToggle = useSelector((state: any) => state?.activityTogglePopup);
    const activityToggleTwo = useSelector((state:any) => state?.activityTogglePopupTwo);

    const campaignType = [
        { value: 'choose', label: 'Choose' },
        { value: 'public_relations', label: 'Public Relations' },
        { value: 'brand', label: 'Brand' },
        { value: 'media', label: 'Media' }
    ];
    const currencySymbol = [
        { value: 'Select', label: 'Select' },
        { value: '$', label: '$' },
        { value: '€', label: '€' },
    ];
    const targeyAudience = [
        { value: 'small_business', label: 'Small Business' },
        { value: 'corporate_companies', label: 'Corporate Companies' },
        { value: 'urban_apartment', label: 'Urban Apartment' },
        { value: 'business', label: 'Business' }
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
            {/* Add New Campaign */}
            <div className={activityToggle ? "toggle-popup sidebar-popup" : "toggle-popup"}>
                <div className="sidebar-layout">
                    <div className="sidebar-header">
                        <h4>Add New Campaign</h4>
                        <Link to="#" className="sidebar-close toggle-btn" onClick={() => dispatch(setActivityTogglePopup(!activityToggle))}><i className="ti ti-x" /></Link>

                    </div>
                    <div className="toggle-body">
                        <form  className="toggle-height">
                            <div className="pro-create">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Name <span className="text-danger">*</span>
                                            </label>
                                            <input type="text" className="form-control" />
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Campaign Type <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                options={campaignType}
                                                className="select2"
                                                placeholder="Choose"
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
                                                options={currencySymbol}
                                                className="select"
                                                placeholder="Choose"
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
                                    <div className="col-lg-12">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Target Audience <span className="text-danger">*</span>
                                            </label>
                                            {/* <Select
                                                options={targeyAudience}
                                                className="select"
                                                isMulti
                                                defaultValue={[targeyAudience[0], targeyAudience[1], targeyAudience[2]]} // Set initial selected options
                                            /> */}
                                            <Select
                                                defaultValue={[targeyAudience[1], targeyAudience[2], targeyAudience[3]]}
                                                isMulti
                                                name="colors"
                                                options={targeyAudience}
                                                // className="basic-multi-select"
                                                classNamePrefix="select"
                                            />


                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Description <span className="text-danger">*</span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                defaultValue={""}
                                            />
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Attachment <span className="text-danger">*</span>
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
                                    </div>
                                </div>
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
            {/* /Add New Campaign */}
            {/* Edit Campaign */}
            <div className={ activityToggleTwo ? "toggle-popup1 sidebar-popup" : "toggle-popup1"}>

                <div className="sidebar-layout">
                    <div className="sidebar-header">
                        <h4>Edit Campaign</h4>
                        <Link to="#" className="sidebar-close1 toggle-btn" onClick={()=> dispatch(setActivityTogglePopupTwo(!activityToggleTwo))}>
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
                                                Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue="Enhanced brand"
                                            />
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Campaign Type <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                options={campaignType}
                                                className="select2"
                                                placeholder="Choose"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Deal Value<span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                defaultValue="$12,989"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Currency <span className="text-danger">*</span>
                                            </label>
                                          
                                            <Select
                                                options={currencySymbol}
                                                className="select"
                                                placeholder="Choose"
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
                                    <div className="col-lg-12">
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Target Audience <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                defaultValue={[targeyAudience[1], targeyAudience[2], targeyAudience[3]]}
                                                isMulti={true}
                                                options={targeyAudience}
                                                className="select"
                                                styles={customStyles}
                                            />
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Description <span className="text-danger">*</span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                defaultValue={""}
                                            />
                                        </div>
                                        <div className="form-wrap">
                                            <label className="col-form-label">
                                                Attachment <span className="text-danger">*</span>
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
                                    </div>
                                </div>
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
            {/* /Edit Campaign */}
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
                                    <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
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
            {/* Delete Campaign */}
            <div className="modal custom-modal fade" id="delete_campaign" role="dialog">
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
                                <h3>Remove Campaign??</h3>
                                <p className="del-info">
                                    Are you sure you want to remove campaign you selected.
                                </p>
                                <div className="col-lg-12 text-center modal-btn">
                                    <Link to="#" className="btn btn-light" data-bs-dismiss="modal">
                                        Cancel
                                    </Link>
                                    <Link to="#" data-bs-dismiss="modal" className="btn btn-danger">
                                        Yes, Delete it
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Delete Campaign */}
        </>

    )
}

export default CompaignComplete
