import { logError } from "../log";
import express from "express";

const ErrorHandler: express.ErrorRequestHandler = (
  err: Error,
  request,
  response,
  _next
) => {
  logError("Unexpected error with path: " + request.path);
  logError(err);
  response.status(500);
  response.render("pages/error/error.ejs", {
    message: err.message,
    error: err,
  });
};

export default ErrorHandler;
