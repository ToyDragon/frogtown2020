export function getCookie(cookie: string): string {
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

export function setCookie(name: string, value: string): void {
  document.cookie =
    name + "=" + value + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
}
