import Services from "./services";
import * as express from "express";
import { AsyncCacher } from "../shared/async_cacher";
import { UserQualityRow } from "./database/dbinfos/db_info_user_quality";

export default function ImagesHandler(
  services: Services
): express.RequestHandler {
  const hqCacher = new AsyncCacher<boolean>(
    60 * 1000, // 60 second timeout
    async (ipAddress: string) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return false;
      }

      const result = await connection.query<UserQualityRow[]>(
        "SELECT * FROM user_quality WHERE ip_address=?;",
        [ipAddress]
      );
      connection.release();
      if (result?.value && result.value.length > 0) {
        return true;
      }

      return false;
    }
  );
  return async (request, response, next) => {
    if (request.params.cardImage) {
      if (await hqCacher.get(request.ip)) {
        response.redirect(
          services.config.storage.externalRoot +
            "/" +
            services.config.storage.awsS3HighQualityImageBucket +
            "/" +
            request.params.cardImage
        );
      } else {
        response.redirect(
          services.config.storage.externalRoot +
            "/" +
            services.config.storage.awsS3CompressedImageBucket +
            "/" +
            request.params.cardImage
        );
      }
    } else {
      next();
    }
  };
}
