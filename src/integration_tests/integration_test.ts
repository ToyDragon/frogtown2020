// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";

export interface RunParams {
  browser: puppeteer.Browser;
  authCookies: puppeteer.Protocol.Network.CookieParam[];
  serverUrl: string;
  port: number;
}

export abstract class IntegrationTest {
  abstract name(): string;
  abstract run(params: RunParams): Promise<boolean>;
}
