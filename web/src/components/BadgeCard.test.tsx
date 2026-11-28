import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BadgeCard } from "./BadgeCard";

import { SAMPLE_BADGES, type Badge } from "@/lib/achievements";

const real: Badge = {
  id: "11111111-1111-1111-1111-111111111111",
  event: "Турнир по физика",
  org: "Garage Science Club",
  date: "Окт 2025",
  place: 2,
  isHidden: false,
  isSample: false,
};

describe("the share button on a badge", () => {
  it("is there on a sample badge, so the demo can show it", () => {
    const sample = SAMPLE_BADGES[0]!;

    render(<BadgeCard b={sample} i={0} />);

    expect(screen.getByRole("button", { name: `Сподели: ${sample.event}` })).toBeInTheDocument();
  });

  it("is there on a real badge", () => {
    render(<BadgeCard b={real} i={0} />);

    expect(screen.getByRole("button", { name: `Сподели: ${real.event}` })).toBeInTheDocument();
  });

  it("is left out on a hidden badge, whose public page would refuse it", () => {
    render(<BadgeCard b={{ ...real, isHidden: true }} i={0} />);

    expect(screen.queryByRole("button", { name: /Сподели/ })).not.toBeInTheDocument();
  });

  it("does not replace the hide toggle on the owner's own page", () => {
    render(<BadgeCard b={real} i={0} onToggleHidden={() => {}} />);

    expect(screen.getByRole("button", { name: /Сподели/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скрий от публичния профил" })).toBeInTheDocument();
  });
});
