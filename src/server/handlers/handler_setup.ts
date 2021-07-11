import express from "express";

import { logCritical } from "../log";
import SetupIssue from "../setupchecker/setupissue";
import CheckSetup from "../setupchecker/setupchecker";
import Services from "../services";
import { GetAllPages } from "../view_data";

let pendingIssueCheck = true;
let issues: SetupIssue[] = [];

// eslint-disable-next-line prettier/prettier
export default function SetupRequiredHandler(services: Services): express.RequestHandler{
  return async (request, response, next) => {
    // Check for server configuration issues
    if (pendingIssueCheck && request.path === "/") {
      issues = await CheckSetup(services);
      pendingIssueCheck = false;
      if (issues.length > 0) {
        logCritical("Server setup error detected.");
      }
    }

    // Redirect if issues found
    if (issues.length > 0 && request.path === "/") {
      response.render("pages/setupissues", {
        issues: issues,
        allViews: GetAllPages(services),
      });
    } else {
      next();
    }
  };
}
