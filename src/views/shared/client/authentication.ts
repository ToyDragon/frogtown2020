import { setCookie, getCookie } from "./cookies";
import { NewUserResponse } from "../handler_types";
import { post } from "./request";

class User {
  public publicId: string;
  public privateId: string;

  public constructor(publicId: string, privateId: string) {
    this.publicId = publicId;
    this.privateId = privateId;
  }
}

export default class AuthSession {
  public user: User;

  public constructor() {
    this.user = new User(getCookie("publicId"), getCookie("privateId"));
  }

  public async ensureValidUser(errorOccurred: boolean): Promise<void> {
    if (
      this.user.publicId === "" ||
      this.user.privateId === "" ||
      errorOccurred
    ) {
      // TODO: Remove this after fully transitioned to prod. It's only necessary to keep IDs
      // around incase they aren't recognized for some reason by the server.
      const oldPublic = getCookie("publicId");
      const oldPrivate = getCookie("privateId");
      if (oldPublic !== "" || oldPrivate !== "") {
        let badIds = getCookie("previousBadIds");
        badIds += ".publicId: " + oldPublic + ",privateId: " + oldPrivate;
        setCookie("previousBadIds", badIds);
      }
      const response = await post<unknown, NewUserResponse>(
        "/authentication/newuser",
        undefined
      );
      if (!response) {
        console.error("Unable to create a user :(");
        return;
      }
      this.user = new User(response.publicId, response.privateId);
      setCookie("publicId", response.publicId);
      setCookie("privateId", response.privateId);
    }
  }

  public changeUser(publicId: string, privateId: string): void {
    this.user = new User(publicId, privateId);
    setCookie("publicId", publicId);
    setCookie("privateId", privateId);
  }
}
