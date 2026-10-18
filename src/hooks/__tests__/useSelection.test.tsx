import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SelectionContext, useSelection } from "../useSelection";
import type { Country, User } from "@/types/quiz";

describe("useSelection", () => {
  it("throws an error when used outside of SelectionProvider", () => {
    expect(() => {
      renderHook(() => useSelection());
    }).toThrow("useSelection must be used within a SelectionProvider.");
  });

  it("returns context value when wrapped in SelectionContext.Provider", () => {
    const mockUser: User = { id: "u-1", name: "Alice", country: "IN", role: "user" };
    const mockCountry: Country = { code: "IN", name: "India" };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SelectionContext.Provider
        value={{
          users: [mockUser],
          countries: [mockCountry],
          selectedUser: mockUser,
          selectedCountry: mockCountry,
          isLoading: false,
          error: null,
          selectUser: () => {},
          selectCountry: () => {},
        }}
      >
        {children}
      </SelectionContext.Provider>
    );

    const { result } = renderHook(() => useSelection(), { wrapper });

    expect(result.current.selectedUser).toEqual(mockUser);
    expect(result.current.selectedCountry).toEqual(mockCountry);
    expect(result.current.isLoading).toBe(false);
  });
});
