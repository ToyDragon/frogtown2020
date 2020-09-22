let name = "";
export function getName(): string {
  return name;
}

export function setServerName(newName: string): void {
  name = newName;
}
