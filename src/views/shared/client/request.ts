export async function post<R, T>(route: string, body: R): Promise<T | null> {
  return await request<R, T>(route, body, "POST");
}

export async function request<R, T>(
  route: string,
  body: R,
  method: string
): Promise<T | null> {
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
  const result = await fetch(route, options);
  try {
    const data = ((await result.json()) as unknown) as T | null;
    return data;
  } catch (e) {
    console.log("Unable to parse JSON");
    console.log(route);
    return null;
  }
}
