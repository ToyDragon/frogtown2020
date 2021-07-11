import { logWarning } from "../log";
import express from "express";

const NotFoundHandler: express.RequestHandler = (request, response, _next) => {
  logWarning("Path not found: " + request.path);
  response.status(404);
  response.render("pages/notfound");
};

export default NotFoundHandler;
