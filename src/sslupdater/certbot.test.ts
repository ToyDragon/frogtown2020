import { exec } from "child_process";

test("certbot is available", (done) => {
  exec("certbot help", (err, stdout, stderr) => {
    expect(err).toBe(null);
    expect(stderr).toBe("");
    expect(stdout).not.toBe("");
    done();
  });
});
