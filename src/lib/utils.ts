export { cn } from "cn";

export const setLocalStorage = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const getLocalStorage = (key: string) => {
  return localStorage.getItem(key);
};

export const simulateDelay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
