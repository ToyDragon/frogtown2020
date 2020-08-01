import { GetMissingConfigProperties } from "./config_loader";
import Config from "./config";

test("Accepts default config", () => {
  const fakeConfig = new Config();
  expect(GetMissingConfigProperties(fakeConfig)).toHaveLength(0);
});

test("Identifies missing root string parameter", () => {
  const fakeConfig = new Config();
  delete fakeConfig.hostname;
  expect(GetMissingConfigProperties(fakeConfig)).toHaveLength(1);
});

test("Identifies missing root boolean parameter", () => {
  const fakeConfig = new Config();
  delete fakeConfig.nohttps;
  expect(GetMissingConfigProperties(fakeConfig)).toHaveLength(1);
});

test("Identifies missing child parameter", () => {
  const fakeConfig = new Config();
  delete fakeConfig.sslOptions.certFile;
  expect(GetMissingConfigProperties(fakeConfig)).toHaveLength(1);
});

test("Identifies multiple missing parameters", () => {
  const fakeConfig = new Config();
  delete fakeConfig.sslOptions.certFile;
  delete fakeConfig.adminId;
  expect(GetMissingConfigProperties(fakeConfig)).toHaveLength(2);
});
