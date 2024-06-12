import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // Assuming you're using React Router
import { all_routes } from "../../../feature-module/router/all_routes";

const Loader = () => {
  const route = all_routes
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const isPathWithLoader =
      location.pathname === route.dealsDashboard ||
      location.pathname === route.leadsDashboard ||
      location.pathname === route.projectDashboard;

    if (isPathWithLoader) {
      // Show the loader when navigating to a new route
      setShowLoader(true);

      // Hide the loader after 2 seconds
      const timeoutId = setTimeout(() => {
        setShowLoader(false);
      }, 2000);

      return () => {
        clearTimeout(timeoutId); // Clear the timeout when component unmounts
      };
    }
  }, [location]);

  return (
    <>
      {showLoader && <Preloader />}
      <div>
        {/* Your other content goes here */}
      </div>
    </>
  );
};

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="preloader-blk">
        <div className="preloader__image">Loading...</div>
      </div>
    </div>
  );
};

export default Loader;
