import SetupIssue from "./setupissue";
import Services from "../services";

import CheckForStorageIssue from "./storagechecker";

/**
 * Primary entry point for checking issues during server startup.
 * This acts as a proxy to all other setup checking function.
 * @param {Config} config
 */
// eslint-disable-next-line prettier/prettier
export default async function CheckSetup(services: Services): Promise<SetupIssue[]> {
  let issues: SetupIssue[] = [];
  issues = issues.concat(await CheckForStorageIssue(services));
  return issues;
}
