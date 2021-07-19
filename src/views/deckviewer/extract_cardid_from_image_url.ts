export function extractCardIDFromImageURL(url: string): string | null {
  const card_url_reg = /https:\/\/[a-z]+\.frogtown\.me\/Images\/[V0-9]+\/([a-zA-Z0-9-]{36})\.jpg/;
  const result = card_url_reg.exec(url);
  if (!result) {
    return null;
  }
  return result[1];
}
