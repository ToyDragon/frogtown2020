import fs from "fs";
import imagemagick from "imagemagick-stream";
import * as stream from "stream";

// If this fails, you probably don't have imagemagick installed.
test("Handles stream with no error.", (done) => {
    const inStream = fs.createReadStream("./static/icons/Mana0.jpg");
    const outStream = fs.createWriteStream("./temp.jpg");
    const imageMagickStream = (imagemagick()
        .resize("672x936")
        .quality(40) as unknown) as stream.Writable;
    inStream.pipe(imageMagickStream).pipe(outStream);
    outStream.on("finish", () => {
        expect(true).toBeTruthy();
        outStream.close();
        fs.unlinkSync("./temp.jpg");
        done();
    });
});