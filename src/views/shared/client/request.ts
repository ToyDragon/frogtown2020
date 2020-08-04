export async function post<R, T>(route: string, body: R): Promise<T | null> {
  return await request<R, T>(route, body, "POST");
}

export async function request<R, T>(
  route: string,
  body: R,
  method: string
): Promise<T | null> {
  const result = await fetch(route, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return ((await result.json()) as unknown) as T | null;
}
