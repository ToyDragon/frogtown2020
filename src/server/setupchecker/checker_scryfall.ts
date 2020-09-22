import SetupIssue from "./setupissue";
import Services from "../services";
import { logInfo } from "../log";

export default async function CheckForScryfallIssue(
  services: Services
): Promise<SetupIssue[]> {
  const issues: SetupIssue[] = [];

  // Check that the storage portal has been configured
  if (!services.scryfallManager) {
    issues.push({
      title: "Missing scryfall service",
      description: "The scryfall service has not properly been configured.",
    });
    return issues;
  }

  // Verify we can get data from scryfall.
  const bulkdataResponse = await services.scryfallManager.requestRaw(
    "https://api.scryfall.com/bulk-data"
  );
  if (!bulkdataResponse || bulkdataResponse.length === 0) {
    issues.push({
      title: "Unable to connect to Scryfall",
      description:
        "Check that Scryfall is up, and that your server has access to external networks.",
    });
  }

  if (issues.length === 0) {
    logInfo("Successfully checked scryfall setup.");
  }

  return issues;
}
