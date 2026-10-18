import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "../avatar";

describe("Avatar component", () => {
  it("renders avatar with fallback text", () => {
    render(
      <Avatar size="sm">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders avatar with badge and image", () => {
    render(
      <Avatar size="lg">
        <AvatarImage src="https://example.com/avatar.jpg" alt="Jane Doe" />
        <AvatarFallback>JD</AvatarFallback>
        <AvatarBadge data-testid="avatar-badge">Online</AvatarBadge>
      </Avatar>,
    );

    expect(screen.getByTestId("avatar-badge")).toBeInTheDocument();
  });

  it("renders avatar group and count", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+2</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
