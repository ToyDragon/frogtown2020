export default class Config {
  public databaseurl = "";
  public adminId = "";
  public hostname = "";
  public ttsDeckJsonDir = "";
  public ttsDraftJsonDir = "";
  public ttsPublicDeckJsonDir = "";
  public hqImagePublicDir = "";
  public imageDir = "";
  public nohttps = false;
  public sslOptions = { keyFile: "", certFile: "" };
  public network = { securePort: 0, unsecurePort: 0 };
}
