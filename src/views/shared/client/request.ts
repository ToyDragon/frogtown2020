export async function post<R, T>(route: string, body: R): Promise<T | null> {
  return await request<R, T>(route, body, "POST");
}

export async function get<T>(route: string): Promise<T | null> {
  return await request<unknown, T>(route, "", "GET");
}

export async function request<R, T>(
  route: string,
  body: R,
  method: string
): Promise<T | null> {
  const result = await requestRaw(route, body, method);
  try {
    const data = (JSON.parse(result) as unknown) as T | null;
    return data;
  } catch (e) {
    console.log("Unable to parse JSON");
    return null;
  }
}

export async function requestRaw<R>(
  route: string,
  body: R,
  method: string
): Promise<string> {
  const options: RequestInit = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  if (method === "GET") {
    delete options.body;
  }
  return await (await fetch(route, options)).text();
}
