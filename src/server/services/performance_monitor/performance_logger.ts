import express from "express";
import { PerformanceMonitor, PerformanceSession } from "./performance_monitor";

export function GetSession(response: express.Response): PerformanceSession {
  return response.locals.perfSession;
}

export function PerformanceLogger(
  perfMon: PerformanceMonitor
): express.RequestHandler {
  return (request, response, next) => {
    let label = request.path.replace(/\/[a-zA-Z0-9]{24,}\//g, "/_id_/");
    label = label.replace(/\/[a-zA-Z0-9-]{24,}\./g, "/_id_.");
    response.locals.perfSession = perfMon.StartSession(
      `Route Handler - "${label}"`
    );
    response.on("finish", () => {
      response.locals.perfSession.Pop();
    });
    next();
  };
}
