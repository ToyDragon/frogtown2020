export function isValidPublicId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function isValidPrivateId(id: string): boolean {
  return /^[0-9a-z]{64}$/.test(id);
}
