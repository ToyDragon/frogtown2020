import SetupIssue from "./setupissue";
import Services from "../services";
import { logInfo } from "../log";

// eslint-disable-next-line prettier/prettier
export default async function CheckForDBIssue(services: Services): Promise<SetupIssue[]> {
  const issues: SetupIssue[] = [];

  // Check that the storage portal has been configured
  const connection = await services.dbManager.getConnection();
  if (!connection) {
    issues.push({
      title: "Misconfigured Database Connection",
      description:
        "The database manager is unable to connect to the database. Check " +
        "that your host, user, and password are configured correctly. " +
        "Verify that your database allows access from this server's IP " +
        "address. Verify that your database firewall allows connections on " +
        "the appropriate ports.",
    });
  }

  if (issues.length === 0) {
    logInfo("Successfully checked DB connection.");
  }

  return issues;
}
