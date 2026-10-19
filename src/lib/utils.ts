export { cn } from "cn";

export const setLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The app can continue with in-memory selection when storage is unavailable.
  }
};

export const getLocalStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const simulateDelay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
