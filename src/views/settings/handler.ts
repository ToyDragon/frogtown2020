import * as express from "express";
import Services from "../../server/services";
import { addEndpointWithParams, addEndpoint } from "../../shared/utils";
import {
  ValidatePrivateIDRequest,
  ValidatePrivateIDResponse,
  QualityChangeRequest,
  UserQualityResponse,
  NameChangeRequest,
  TTSBackChangeRequest,
} from "./types";
import { UserKeysRow } from "../../server/services/database/dbinfos/db_info_user_keys";
import { UserQualityRow } from "../../server/services/database/dbinfos/db_info_user_quality";

// Router that handles page specific request.
export default function handler(services: Services): express.Router {
  const router = express.Router();

  addEndpoint<UserQualityResponse>(router, "/check_quality", async (user) => {
    const connection = await services.dbManager.getConnection();
    if (!connection) {
      return null;
    }

    const result = await connection.query<UserQualityRow[]>(
      "SELECT * FROM user_quality WHERE ip_address=?;",
      [user.ipAddress]
    );
    connection.release();
    if (!result || !result.value || result.value.length === 0) {
      return {
        isHQ: false,
      };
    }

    return {
      isHQ: true,
    };
  });

  addEndpointWithParams<QualityChangeRequest, void>(
    router,
    "/change_quality",
    async (user, params) => {
      if (!user.ipAddress || user.ipAddress.length > 64) {
        return;
      }
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return;
      }
      if (params.isHQ) {
        await connection.query(
          "REPLACE INTO user_quality (ip_address) VALUES (?);",
          [user.ipAddress]
        );
      } else {
        await connection.query("DELETE FROM user_quality WHERE ip_address=?;", [
          user.ipAddress,
        ]);
      }

      connection.release();
    }
  );

  addEndpointWithParams<ValidatePrivateIDRequest, ValidatePrivateIDResponse>(
    router,
    "/validate_private_id",
    async (_user, params) => {
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return null;
      }
      const result = await connection.query<UserKeysRow[]>(
        "SELECT * FROM user_keys WHERE private_id=?;",
        [params.id]
      );
      connection.release();
      if (!result || !result.value || result.value.length === 0) {
        return null;
      }

      return {
        publicId: result.value[0].public_id,
      };
    }
  );

  addEndpointWithParams<NameChangeRequest, void>(
    router,
    "/change_name",
    async (user, params) => {
      if (params.newName.length > 30) {
        return;
      }
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return;
      }

      await connection.query<UserKeysRow[]>(
        "UPDATE user_keys SET name=? WHERE private_id=?;",
        [params.newName, user.privateId]
      );

      connection.release();
    }
  );

  addEndpointWithParams<TTSBackChangeRequest, void>(
    router,
    "/change_tts_back",
    async (user, params) => {
      if (params.newURL.length > 256) {
        return;
      }
      const connection = await services.dbManager.getConnection();
      if (!connection) {
        return;
      }

      await connection.query<UserKeysRow[]>(
        "UPDATE user_keys SET back_url=? WHERE private_id=?;",
        [params.newURL, user.privateId]
      );

      connection.release();
    }
  );

  return router;
}
