import Services from "../../server/services";
import { httpsGet } from "../../shared/utils";
import { logInfo, logError } from "../../server/log";
import { trySetBatchInProgress, endBatch } from "./batch_status";

export async function getSetsMissingSVG(services: Services): Promise<string[]> {
  const setCodeToSetName = await httpsGet<Record<string, string>>(
    services.config.storage.externalRoot +
      "/" +
      services.config.storage.awsS3DataMapBucket +
      "/SetCodeToSetName.json"
  );
  if (!setCodeToSetName) {
    return [];
  }

  const allUploadedSVGsArray = await services.storagePortal.listObjects(
    services.config.storage.awsS3SetSVGBucket
  );
  const hasSVGMap: Record<string, boolean> = {};
  for (const svg of allUploadedSVGsArray) {
    hasSVGMap[svg] = true;
  }

  const missingSVGs = [];
  for (const setCode in setCodeToSetName) {
    if (!hasSVGMap[setCode + ".svg"]) {
      missingSVGs.push(setCode);
    }
  }

  logInfo("Sets missing svg: " + JSON.stringify(missingSVGs));
  return missingSVGs;
}

export async function downloadMissingSVGs(services: Services): Promise<void> {
  const connection = await services.dbManager.getConnectionTimeout(60 * 1000);
  if (!connection) {
    return;
  }
  if (!trySetBatchInProgress(connection)) {
    connection.release();
    return;
  }

  const setsToDownload = await getSetsMissingSVG(services);
  logInfo("Updating " + setsToDownload.length + " missing SVGs.");

  for (const setCode of setsToDownload) {
    const setDetails = await services.scryfallManager.request<{
      icon_svg_uri: string;
    }>("https://api.scryfall.com/sets/" + setCode);
    if (!setDetails) {
      logError("Failed to load set details for " + setCode);
      continue;
    }

    const svgData = await services.scryfallManager.requestRaw(
      setDetails.icon_svg_uri
    );
    if (!svgData) {
      logError("Unable to load set SVG for " + setCode);
      continue;
    }

    if (
      !(await services.storagePortal.uploadStringToBucket(
        services.config.storage.awsS3SetSVGBucket,
        setCode + ".svg",
        svgData
      ))
    ) {
      logError("Error uploading svg for " + setCode);
    } else {
      logInfo("Downloaded " + setCode + ".svg");
    }
  }

  await endBatch(connection);
  connection.release();
}
