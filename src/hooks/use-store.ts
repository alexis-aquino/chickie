import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
