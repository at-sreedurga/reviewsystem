import React from "react";
import { render } from "react-dom";
import _ from "lodash";
import {
  BrowserRouter as Router,
} from "react-router-dom";

import RouteWithSubRoutes from "app/components/route/with-sub-routes";
import { isBrowser } from "./utils";
import { loadModuleByUrl, idlePreload, isModuleLoaded } from "./utils/bundler";

// Collect routes from all the routes
// loaded over time
let collectedRoutes = [];

/**
 * Render routes when routes are loaded
 */
const renderRoutes = () => {
  "use strict";
  if (typeof window !== "undefined") {
    render((
      <Router>
        <div>
          {_.map(collectedRoutes, (route, i) => {
            return <RouteWithSubRoutes key={i} {...route}/>;
          })}
        </div>
      </Router>
    ), document.getElementById("app"));
  }
};

// Browser operations
const initBrowserOperations = () => {
  "use strict";

  if (!isBrowser()) return;

  // Load in respect to current path on init
  loadModuleByUrl(window.location.pathname, () => {
    renderRoutes();
    idlePreload(1000);
  });

  // Override push state
  let pushState = window.history.pushState;
  window.history.pushState = function (e, page, url) {
    pushState.apply(history, arguments);
    document.dispatchEvent(new CustomEvent("location-change", {detail: {state: e.state, url, page}}));
  };
  window.onpopstate = function(e) {
    document.dispatchEvent(new CustomEvent("location-change", {detail: { state: e.state, url: window.location.pathname}}));
  };
  document.addEventListener("location-change", (e) => {
    const { url } = e.detail;
    if (!isModuleLoaded(url)) {
      renderRouteLoader();
      loadModuleByUrl(url, () => {
        renderRoutes();
      });
    } else {
      renderRoutes();
    }
  });
};
initBrowserOperations();

/**
 * Load routes when a bundle is included,
 * this will be called from pages
 * @param routes
 */
export const updateRoutes = (routes) => {
  "use strict";
  collectedRoutes = [...collectedRoutes, ...routes];
};
const renderRouteLoader = () => {
  "use strict";
  if (typeof window !== "undefined") {
    render((
      <div>Loading your route.. please wait.</div>
    ), document.getElementById("app"));
  }
};
