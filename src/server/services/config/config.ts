export default class Config {
  public adminId = "";
  public hostname = "";
  public nohttps = false;
  public sslOptions = {
    keyFile: "",
    certFile: "",
  };
  public network = {
    securePort: 0,
    unsecurePort: 0,
  };
  public mapFiles: string[] = [];
  public storage = {
    externalRoot: "",
    awsAccessKeyIdFile: "",
    awsSecretAccessKeyFile: "",
    awsS3FullQualityImageBucket: "",
    awsS3HighQualityImageBucket: "",
    awsS3CompressedImageBucket: "",
    awsS3SetSVGBucket: "",
    awsS3DataMapBucket: "",
    awsS3WellKnownBucket: "",
  };
  public database = {
    host: "",
    user: "",
    passwordFile: "",
  };
  public imageQualityCacheDuration = 0;
  public cardImageRoutes: string[] = [];
}
