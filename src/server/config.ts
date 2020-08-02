export default class Config {
  public adminId = "";
  public hostname = "";
  public ttsDeckJsonDir = "";
  public ttsDraftJsonDir = "";
  public ttsPublicDeckJsonDir = "";
  public hqImagePublicDir = "";
  public imageDir = "";
  public nohttps = false;
  public sslOptions = {
    keyFile: "",
    certFile: "",
  };
  public network = {
    securePort: 0,
    unsecurePort: 0,
  };
  public storage = {
    awsAccessKeyIdFile: "",
    awsSecretAccessKeyFile: "",
    awsS3FullQualityImageBucket: "",
    awsS3HighQualityImageBucket: "",
    awsS3CompressedImageBucket: "",
    awsS3DataMapBucket: "",
  };
  public database = {
    host: "",
    user: "",
    passwordFile: "",
  };
}
