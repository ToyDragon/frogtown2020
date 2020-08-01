declare let includedData: { errorOccurred: boolean };

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
    this.user = new User(
      this.GetCookie("publicId"),
      this.GetCookie("privateId")
    );
  }

  public IsValidPublicId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  public IsValidPrivateId(id: string): boolean {
    return /^[0-9a-z]{64}$/.test(id);
  }

  public GetCookie(cookie: string): string {
    const name = cookie + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  public SetCookie(name: string, value: string): void {
    document.cookie =
      name + "=" + value + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
  }

  public CreateNewUser(): void {
    $.get("/Shared/newuser", (response) => {
      response = JSON.parse(response);
      this.user = new User(response._id, response.privateId);
      this.SetCookie("publicId", response._id);
      this.SetCookie("privateId", response.privateId);
      $(document).trigger("newuser");
    });
  }

  public ChangeUser(publicId: string, privateId: string): void {
    this.user = new User(publicId, privateId);
    this.SetCookie("publicId", publicId);
    this.SetCookie("privateId", privateId);
  }
}

const session = new AuthSession();

$(document).ready(() => {
  if (
    session.user.publicId === "" ||
    session.user.privateId === "" ||
    includedData.errorOccurred
  ) {
    session.CreateNewUser();
  }

  $("#tbNewDeck").on("click", () => {
    $.post("/Shared/newDeck", (response) => {
      if (response) {
        const deck = JSON.parse(response);
        if (deck && deck._id) {
          console.log("/deckViewer/" + deck._id + "/edit.html");
          window.location.replace("/deckViewer/" + deck._id + "/edit.html");
        }
      }
    });
  });
});
