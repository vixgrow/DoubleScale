import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Select from 'react-select'

interface Signer {
    name: string;
    email: string;
  }
const AddFile = () => {
    const [signers, setSigners] = useState<Signer[]>([{ name: '', email: '' }]);

    const options3 = [
        { value: 'select', label: 'Select' },
        { value: 'collins', label: 'Collins' },
        { value: 'konopelski', label: 'Konopelski' },
        { value: 'adams', label: 'Adams' }
      ];
    const options = [
        { value: 'select', label: 'Select' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Proposal', label: 'Proposal' },
        { value: 'Quote', label: 'Quote' }
      ];
    const options1 = [
        { value: 'select', label: 'Select' },
        { value: 'Admin', label: 'Admin' },
        { value: 'Jackson Daniel', label: 'Jackson Daniel' },
      ];
    const options2 = [
        { value: 'select', label: 'Select' },
        { value: 'en', label: 'en' },
        { value: 'es', label: 'es' },
        { value: 'ru', label: 'ru' },
      ];
      const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const list = [...signers];
        list[index] = { ...list[index], [name]: value }; // Corrected line
        setSigners(list);
      };
    
      const handleAddSigner = () => {
        setSigners([...signers, { name: '', email: '' }]);
      };
    
      const handleRemoveSigner = (index: number) => {
        const list = [...signers];
        list.splice(index, 1);
        setSigners(list);
      };
    return (
<>
  {/* Add File */}
  <div
    className="modal custom-modal fade custom-modal-two modal-padding"
    id="new_file"
    role="dialog"
  >
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Create New File</h5>
          <button
            type="button"
            className="btn-close position-static"
            data-bs-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal-body p-0">
          <div className="add-info-fieldset">
            <div className="add-details-wizard">
              <ul className="progress-bar-wizard">
                <li className="active">
                  <span>
                    <i className="ti ti-file" />
                  </span>
                  <div className="multi-step-info">
                    <h6>Basic Info</h6>
                  </div>
                </li>
                <li>
                  <span>
                    <i className="ti ti-circle-plus" />
                  </span>
                  <div className="multi-step-info">
                    <h6>Add Recipient</h6>
                  </div>
                </li>
              </ul>
            </div>
            <fieldset id="first-field-file">
              <form>
                <div className="contact-input-set">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Choose Deal <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={options3} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Document Type <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={options} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Owner <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={options1} />
 
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Title <span className="text-danger"> *</span>
                        </label>
                        <input className="form-control" type="text" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Locale <span className="text-danger">*</span>
                        </label>
                        <Select className="select" options={options2} />

                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="signature-wrap">
                        <h4>Signature</h4>
                        <ul className="nav sign-item">
                          <li className="nav-item">
                            <span
                              className=" mb-0"
                              data-bs-toggle="tab"
                              data-bs-target="#nosign"
                            >
                              <input
                                type="radio"
                                className="status-radio"
                                id="sign1"
                                name="email"
                              />
                              <label htmlFor="sign1">
                                <span className="sign-title">No Signature</span>
                                This document does not require a signature
                                before acceptance.
                              </label>
                            </span>
                          </li>
                          <li className="nav-item">
                            <span
                              className="active mb-0"
                              data-bs-toggle="tab"
                              data-bs-target="#use-esign"
                            >
                              <input
                                type="radio"
                                className="status-radio"
                                id="sign2"
                                name="email"
                                defaultChecked
                              />
                              <label htmlFor="sign2">
                                <span className="sign-title">
                                  Use e-signature
                                </span>
                                This document require e-signature before
                                acceptance.
                              </label>
                            </span>
                          </li>
                        </ul>
                        <div className="tab-content">
                        <div className="tab-pane show active" id="use-esign">
                        <div className="input-block mb-0">
                            <label className="col-form-label">
                            Document Signers <span className="text-danger">*</span>
                            </label>
                        </div>
                        <div className="sign-content">
                            {signers.map((signer, index) => (
                            <div className="row" key={index}>
                                <div className="col-md-6">
                                <div className="form-wrap">
                                    <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Enter Name"
                                    name="name"
                                    value={signer.name}
                                    onChange={event => handleInputChange(index, event)}
                                    />
                                </div>
                                </div>
                                <div className="col-md-6">
                                <div className="d-flex align-items-center">
                                    <div className="float-none form-wrap me-3 w-100">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Email Address"
                                        name="email"
                                        value={signer.email}
                                        onChange={event => handleInputChange(index, event)}
                                    />
                                    </div>
                                    <div className="input-btn form-wrap">
                                    {index === signers.length - 1 && (
                                        <button className="add-sign" onClick={handleAddSigner}>
                                        <i className="ti ti-circle-plus"></i>
                                        </button>
                                    )}
                                    {index !== 0 && (
                                        <button
                                        className="remove-sign"
                                        onClick={() => handleRemoveSigner(index)}
                                        >
                                        <i className="ti ti-circle-minus"></i>
                                        </button>
                                    )}
                                    </div>
                                </div>
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="input-block mb-3">
                        <label className="col-form-label">
                          Content <span className="text-danger"> *</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Add Content"
                          defaultValue={""}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 text-end form-wizard-button modal-btn">
                      <button className="btn btn-light" type="reset">
                        Reset
                      </button>
                      <button
                        className="btn btn-primary wizard-next-btn"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </fieldset>
            <fieldset>
              <form>
                <div className="contact-input-set">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="signature-wrap">
                        <h4 className="mb-2">
                          Send the document to following signers
                        </h4>
                        <p>In order to send the document to the signers</p>
                        <div className="input-block mb-0">
                          <label className="col-form-label">
                            Recipients (Additional recipients)
                          </label>
                        </div>
                        <div className="sign-content">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="form-wrap">
                                <input
                                  className="form-control"
                                  type="text"
                                  placeholder="Enter Name"
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="d-flex align-items-center">
                                <div className="float-none form-wrap me-3 w-100">
                                  <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Email Address"
                                  />
                                </div>
                                <div className="input-btn form-wrap">
                                  <Link
                                    to="#"
                                    className="add-sign"
                                  >
                                    <i className="ti ti-circle-plus" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Message Subject{" "}
                          <span className="text-danger"> *</span>
                        </label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Enter Subject"
                        />
                      </div>
                      <div className="form-wrap">
                        <label className="col-form-label">
                          Message Text <span className="text-danger"> *</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Your document is ready"
                          defaultValue={""}
                        />
                      </div>
                      <button className="btn btn-light mb-3">Send Now</button>
                      <div className="send-success">
                        <p>
                          <i className="ti ti-circle-check" /> Document sent
                          successfully to the selected recipients
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-12 text-end form-wizard-button modal-btn">
                      <button className="btn btn-light" type="reset">
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        type="button"
                        data-bs-dismiss="modal"
                      >
                        Save &amp; Next
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* /Add File */}
</>

    )
}

export default AddFile
