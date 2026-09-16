import type { Boss, Dungeon, DungeonDetail, HuntField, ItemDetail, ItemListEntry, Monster, UnratedMap } from "../domain/types";

type ItemSearchResponse = { items: ItemListEntry[]; total: number };

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).error || message; } catch { /* invalid error response */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  money: (signal?: AbortSignal) => getJson<{items: Monster[]}>("/api/money", signal),
  skills: (signal?: AbortSignal) => getJson<import("../ClassGuide").SkillData>("/api/skills", signal),
  monsters: (params: URLSearchParams, signal?: AbortSignal) => getJson<{ items: Monster[] }>(`/api/monsters?${params}`, signal),
  monsterSearch: (query: string, signal?: AbortSignal) => getJson<{ items: Monster[] }>(`/api/search?q=${encodeURIComponent(query)}`, signal),
  itemSearch: (params: URLSearchParams, signal?: AbortSignal) => getJson<ItemSearchResponse>(`/api/item-search?${params}`, signal),
  itemDetail: (params: URLSearchParams) => getJson<{ item: ItemDetail }>(`/api/item-detail?${params}`),
  fields: () => getJson<{ fields: HuntField[]; unrated_maps?: UnratedMap[] }>("/api/fields"),
  dungeons: () => getJson<{ maps: Dungeon[] }>("/api/dungeons"),
  dungeon: (slug: string) => getJson<DungeonDetail>(`/api/dungeons/${encodeURIComponent(slug)}`),
  bosses: () => getJson<{ bosses: Boss[] }>("/api/bosses"),
};
