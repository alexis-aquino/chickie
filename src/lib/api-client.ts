import type { InventoryItem, PurchaseRecord, Supplier } from "@/types/inventory";
import type { Customer, Promotion } from "@/types/crm";
import type { Role, UserProfile } from "@/types/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "chickie_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface StoreSnapshot {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  purchaseHistory: PurchaseRecord[];
  customers: Customer[];
  promotions: Promotion[];
}

class ApiError extends Error {}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request to ${path} failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchStoreSnapshot(): Promise<StoreSnapshot> {
  return apiFetch<StoreSnapshot>("/api/store");
}

export function submitPurchaseRecords(
  records: Omit<PurchaseRecord, "id" | "delivered">[],
): Promise<PurchaseRecord[]> {
  return apiFetch<PurchaseRecord[]>("/api/purchase-records", {
    method: "POST",
    body: JSON.stringify(records),
  });
}

export function markPurchaseDelivered(id: string): Promise<PurchaseRecord> {
  return apiFetch<PurchaseRecord>(`/api/purchase-records/${id}/deliver`, { method: "PATCH" });
}

export function createInventoryItem(item: Omit<InventoryItem, "id">): Promise<InventoryItem> {
  return apiFetch<InventoryItem>("/api/inventory-items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function updateInventoryItem(id: string, patch: Omit<InventoryItem, "id">): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/api/inventory-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteInventoryItem(id: string): Promise<void> {
  return apiFetch<void>(`/api/inventory-items/${id}`, { method: "DELETE" });
}

export function activatePromotion(id: string): Promise<Promotion> {
  return apiFetch<Promotion>(`/api/promotions/${id}/activate`, { method: "PATCH" });
}

/** Fetches the backend's matplotlib-rendered chart as a displayable object URL. */
export async function fetchInventoryByCategoryChartUrl(): Promise<string> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/analytics/inventory-by-category.png`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(`Failed to load chart (status ${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export interface AuthTokenResponse {
  accessToken: string;
  user: UserProfile;
}

export interface RegisterParams {
  name: string;
  businessName: string;
  email: string;
  password: string;
  role: Role;
  seedDemo: boolean;
}

export function register(params: RegisterParams): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function login(email: string, password: string): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/auth/me");
}

export function updateProfile(
  patch: Partial<Pick<UserProfile, "name" | "phone" | "bio" | "avatar" | "theme" | "accentColor">>,
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch<void>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export { ApiError };
