import Services from "./services";
import * as express from "express";

export default function ImagesHandler(
  services: Services
): express.RequestHandler {
  return async (request, response, next) => {
    if (request.params.cardImage) {
      //TODO handle HQ vs LQ
      response.redirect(
        services.config.storage.externalRoot +
          "/" +
          services.config.storage.awsS3HighQualityImageBucket +
          "/" +
          request.params.cardImage
      );
    } else {
      next();
    }
  };
}
