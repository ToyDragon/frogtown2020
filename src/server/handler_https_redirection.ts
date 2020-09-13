import express from "express";

const HandlerHTTPsRedirection: express.RequestHandler = (
  request,
  response,
  _next
) => {
  if (
    !request.subdomains ||
    request.subdomains.length === 0 ||
    request.subdomains[0] === ""
  ) {
    response.redirect("https://www." + request.headers.host + request.url);
  } else {
    response.redirect("https://" + request.headers.host + request.url);
  }
};

export default HandlerHTTPsRedirection;
