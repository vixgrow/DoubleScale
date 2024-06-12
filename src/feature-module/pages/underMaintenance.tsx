import React from "react";
import { all_routes } from "../router/all_routes";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";

const UnderMaintenance = () => {
  const route = all_routes;
  return (
    <div className="container">
      <div className="error-box">
        <div className="error-img">
          <ImageWithBasePath
            src="assets/img/authentication/maintenance-img.png"
            className="img-fluid"
            alt=""
          />
        </div>
        <div className="error-content">
          <h3>We are Under Maintenance</h3>
          <p>
            Sorry for any inconvenience caused, we have almost done Will get
            back soon!
          </p>
          <Link to={route.dealsDashboard} className="btn btn-primary">
            <i className="ti ti-arrow-narrow-left" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnderMaintenance;
