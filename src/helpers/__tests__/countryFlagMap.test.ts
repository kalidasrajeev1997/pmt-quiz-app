import { describe, expect, it } from "vitest";
import countryFlagMap from "../countryFlagMap";

describe("countryFlagMap", () => {
  it("maps supported country codes to flag assets", () => {
    expect(countryFlagMap.IN).toBeDefined();
    expect(countryFlagMap.GB).toBeDefined();
    expect(countryFlagMap.AE).toBeDefined();
  });
});
