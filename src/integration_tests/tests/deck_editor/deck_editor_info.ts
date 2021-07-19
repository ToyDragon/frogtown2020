export default interface DeckEditorInfo {
  mainboard: { name: string; id: string; count: number; groupLabel: string }[];
  sideboard: { name: string; id: string; count: number; groupLabel: string }[];
}
