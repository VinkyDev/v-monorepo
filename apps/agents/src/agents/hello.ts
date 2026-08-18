"use agent";
import { useModel } from "@flue/runtime";

export function Hello() {
  useModel("kimi-coding/k3-256k");
  return "You are a helpful assistant. Keep replies short.";
}
