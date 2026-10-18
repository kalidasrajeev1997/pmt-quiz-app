import { beforeEach, describe, expect, it } from "vitest";
import {
  countryFilterService,
  getCountry,
  getUser,
  userFilterService,
} from "../filters.service";

describe("filters.service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored in localStorage", () => {
    expect(getUser()).toBeNull();
    expect(getCountry()).toBeNull();
  });

  it("saves and retrieves user filter", () => {
    userFilterService("user-123");
    expect(getUser()).toBe("user-123");
  });

  it("saves and retrieves country filter", () => {
    countryFilterService("GB");
    expect(getCountry()).toBe("GB");
  });
});
