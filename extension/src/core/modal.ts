import type { CardField, Mode, View } from "./types";

export interface ModalSnapshot {
  mode: Mode;
  view: View;
  cardSelection: CardField;
}

export function toggleViewFromAnyMode(snapshot: ModalSnapshot): ModalSnapshot {
  return {
    ...snapshot,
    mode: "normal",
    view: snapshot.view === "card" ? "chat" : "card",
  };
}

export function nextCardField(field: CardField): CardField {
  if (field === "front") return "back";
  if (field === "back") return "tags";
  return "tags";
}

export function previousCardField(field: CardField): CardField {
  if (field === "tags") return "back";
  if (field === "back") return "front";
  return "front";
}
