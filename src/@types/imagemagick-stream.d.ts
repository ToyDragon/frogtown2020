declare module "imagemagick-stream" {
  import { WriteableStream } from "stream";
  class ImageMagick extends WriteableStream {
    public constructor(imageFile?: string);
    public resume(): void;
    public inputFormat(args: string): ImageMagick;
    public outputFormat(args: string): ImageMagick;
    public quality(args: number): ImageMagick;
    public resize(args: string): ImageMagick;
    public scale(args: string): ImageMagick;
    public extent(args: string): ImageMagick;
    public crop(args: string): ImageMagick;
    public gravity(args: string): ImageMagick;
    public thumbnail(args: string): ImageMagick;
    public autoOrient(args: string): ImageMagick;
    public type(args: string): ImageMagick;
    public annotate(args: string): ImageMagick;
    public append(args: string): ImageMagick;
    public set(args: string): ImageMagick;
    public op(args: string): ImageMagick;
    public from(args: string): ImageMagick;
    public to(args: string): fs.WriteStream;
    public spawn(): void;
  }

  export default function (imageFile?: string): ImageMagick;
}
