/**
 * QuillCRM dependencies
 */
import {
  getAdminPages,
  HistoryRouter,
  Route,
  getHistory,
  Routes,
} from "@quillcrm/navigation";

/**
 * WordPress Dependencies
 */
import { SlotFillProvider } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { useSelect, useDispatch } from "@wordpress/data";
import apiFetch from "@wordpress/api-fetch";

/**
 * External dependencies
 */
import { keys, isEmpty } from "lodash";
import { ThreeDots as Loader } from "react-loader-spinner";
import { css } from "@emotion/css";

/**
 * Internal dependencies
 */
import { NavBar } from "../components";
import { Controller } from "./controller";
import "./style.scss";

export const Layout = (props) => {
  const [isLoading, setIsLoading] = useState(props.page.requiresInitialPayload);

  useEffect(() => {}, []);

  return (
    <SlotFillProvider>
      <div className="qcrm-layout">
        <NavBar />
        <div className="qcrm-layout__main">
          {isLoading ? (
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                min-height: 100vh;
                justify-content: center;
                align-items: center;
              `}
            >
              <Loader color="#cb3b87" height={50} width={50} />
            </div>
          ) : (
            <Controller {...props} />
          )}
        </div>
      </div>
    </SlotFillProvider>
  );
};

const _PageLayout = () => {
  return (
    <>
      {/* @ts-ignore */}
      <HistoryRouter history={getHistory()}>
        <Routes>
          {Object.values(getAdminPages()).map((page) => {
            return (
              <Route
                key={page.path}
                path={page.path}
                element={<Layout page={page} />}
              />
            );
          })}
        </Routes>
      </HistoryRouter>
    </>
  );
};

export default _PageLayout;
