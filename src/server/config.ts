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
  };
  public database = {
    host: "",
    user: "",
    passwordFile: "",
  };
  public cardImageRoutes: string[] = [];
}
