import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BadgeCard } from "./BadgeCard";

import type { Badge } from "@/lib/achievements";

const badge: Badge = {
  id: "11111111-1111-1111-1111-111111111111",
  event: "Турнир по физика",
  org: "Garage Science Club",
  date: "Окт 2025",
  place: 2,
  isHidden: false,
};

describe("the share button on a badge", () => {
  it("is there, so a badge can be shared from wherever the card is shown", () => {
    render(<BadgeCard b={badge} i={0} />);

    expect(screen.getByRole("button", { name: `Сподели: ${badge.event}` })).toBeInTheDocument();
  });

  it("is left out on a hidden badge, whose public page would refuse it", () => {
    render(<BadgeCard b={{ ...badge, isHidden: true }} i={0} />);

    expect(screen.queryByRole("button", { name: /Сподели/ })).not.toBeInTheDocument();
  });

  it("does not replace the hide toggle on the owner's own page", () => {
    render(<BadgeCard b={badge} i={0} onToggleHidden={() => {}} />);

    expect(screen.getByRole("button", { name: /Сподели/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скрий от публичния профил" })).toBeInTheDocument();
  });
});
