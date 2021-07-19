export interface Range {
  start: number;
  end: number;
}

export default function checkForCard(buffer: string): Range | null {
  let brackets = 0;
  let start = -1;
  for (let i = 0; i < buffer.length; i++) {
    const char = buffer.charAt(i);
    if (char === "{") {
      if (start === -1) {
        start = i;
      }
      brackets++;
    }
    if (char === "}" && brackets > 0) {
      brackets--;
      if (brackets === 0) {
        return {
          start: start,
          end: i,
        };
      }
    }
  }
  return null;
}
