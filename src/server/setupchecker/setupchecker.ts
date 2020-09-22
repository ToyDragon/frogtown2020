import SetupIssue from "./setupissue";
import Services from "../services";

import CheckForStorageIssue from "./checker_storage";
import CheckForDBIssue from "./checker_db";
import CheckForScryfallIssue from "./checker_scryfall";

// Primary entry point for checking issues during server startup.
// This acts as a proxy to all other setup checking function.
export default async function CheckSetup(
  services: Services
): Promise<SetupIssue[]> {
  let issues: SetupIssue[] = [];
  issues = issues.concat(await CheckForStorageIssue(services));
  issues = issues.concat(await CheckForDBIssue(services));
  issues = issues.concat(await CheckForScryfallIssue(services));
  return issues;
}
