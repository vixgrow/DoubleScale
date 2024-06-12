import React from "react";
import Select, { StylesConfig } from "react-select";

const Reports_modal = () => {
  const options = [
    { value: "pdf", label: "Download as PDF" },
    { value: "excel", label: "Download as Excel" },
  ];
  const options2 = [
    { value: "all", label: "All Fields" },
    { value: "name", label: "Name" },
    { value: "position", label: "Position" },
    { value: "owner", label: "Owner" },
    { value: "location", label: "Location" },
    { value: "phone", label: "Phone" },
    { value: "dateCreated", label: "Date Created" },
  ];
  const options3 = [
    { value: "all", label: "All Position" },
    { value: "installer", label: "Installer" },
    { value: "seniorManager", label: "Senior Manager" },
    { value: "testEngineer", label: "Test Engineer" },
    { value: "uiUxDesigner", label: "UI / UX Designer" },
  ];
  const options4 = [
    { value: "all", label: "All Source" },
    { value: "google", label: "Google" },
    { value: "campaigns", label: "Campaigns" },
    { value: "referrals", label: "Referrals" },
    { value: "paidSocial", label: "Paid Social" },
  ];
  const options5 = [
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
    { value: "2021", label: "2021" },
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
    <div className="modal custom-modal fade" id="download_report" role="dialog">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Download Report</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="modal-body">
            <form >
              <div className="mb-3">
                <label className="form-label">
                  File Type <span className="text-danger">*</span>
                </label>
                <Select
                  styles={customStyles}
                  className="select"
                  options={options}
                  placeholder="Download as PDF"
                />
              </div>
              <div className="mb-3">
                <h5>Filters</h5>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  File Type <span className="text-danger">*</span>
                </label>
                <Select
                  styles={customStyles}
                  className="select"
                  options={options2}
                  placeholder="All Fields"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Position<span className="text-danger">*</span>
                </label>
                <Select
                  styles={customStyles}
                  className="select"
                  options={options3}
                  placeholder="All Position"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Source<span className="text-danger">*</span>
                </label>

                <Select
                  styles={customStyles}
                  className="select"
                  options={options4}
                  placeholder="All Source"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Select Year<span className="text-danger">*</span>
                </label>
                <Select
                  styles={customStyles}
                  className="select"
                  options={options5}
                  placeholder="2013"
                />
              </div>
              <div className="col-lg-12 text-end modal-btn">
                <button
                  type="submit"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Download Now
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports_modal;
