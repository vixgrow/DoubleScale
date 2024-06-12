import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom'
import { setActivityTogglePopup, setActivityTogglePopupTwo } from '../data/redux/commonSlice';
import Select, { StylesConfig } from 'react-select';

const CampaignModal = () => {

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
                                                defaultValue={[targeyAudience[1]]}
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
                        <h4>Edit Pipeline</h4>
                        <Link to="#" className="sidebar-close1 toggle-btn" onClick={()=> dispatch(setActivityTogglePopupTwo(!activityToggleTwo))}><i className="ti ti-x" /></Link>


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
                                                className="select"
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
                                                isMulti
                                                name="colors"
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
        </>

    )
}

export default CampaignModal
