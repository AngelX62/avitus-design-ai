import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ACTION_RISK_TIER } from "@/lib/actionTiers";
import { AvaraLauncher } from "@/components/AvaraLauncher";
import { AvaraShell } from "@/components/AvaraShell";
import { ActionQueuePanel } from "@/components/overview/ActionQueuePanel";
import { STUDIO_NAV_ITEMS } from "@/lib/studioNav";

describe("v2.9 active Avara UI skeletons", () => {
  it("renders an empty Action Queue without fake actions", () => {
    render(
      <MemoryRouter>
        <ActionQueuePanel items={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No urgent owner actions right now.")).toBeInTheDocument();
    expect(screen.getByText(/deterministic pipeline signals/i)).toBeInTheDocument();
  });

  it("renders Tier 1 Action Queue items", () => {
    render(
      <MemoryRouter>
        <ActionQueuePanel
          items={[
            {
              id: "item-1",
              kind: "needs_review",
              tier: ACTION_RISK_TIER.OWNER_VISIBLE,
              title: "1 lead needs review",
              reason: "The lead needs manual review.",
              suggestedAction: "Open the lead inbox.",
              href: "/leads",
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("1 lead needs review")).toBeInTheDocument();
    expect(screen.getByText("Tier 1")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/leads");
  });

  it("includes Avara in the studio navigation", () => {
    expect(STUDIO_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: "/avara", label: "Avara" }),
      ]),
    );
  });

  it("opens compact Avara and runs a local Command Thread approval preview", () => {
    vi.useFakeTimers();

    try {
      render(<AvaraShell actionCount={3} />);

      expect(screen.queryByRole("textbox", { name: /avara/i })).not.toBeInTheDocument();
      const launcher = screen.getByRole("button", { name: /open avara/i });
      const launcherOrb = within(launcher).getByTestId("avara-crystal-orb");
      expect(launcher).toHaveAttribute("data-state", "ready");
      expect(launcherOrb).toHaveAttribute("data-state", "ready");
      expect(launcher.querySelector(".avara-3d-scene")).toBeInTheDocument();
      expect(launcher.querySelector(".avara-3d-rotor")).toBeInTheDocument();
      expect(launcher.querySelector(".avara-core-glow")).toBeInTheDocument();
      expect(launcher.querySelector(".avara-inclusion-layer")).toBeInTheDocument();
      expect(launcher.querySelectorAll(".avara-shard")).toHaveLength(20);
      expect(within(launcher).queryByText("Avara")).not.toBeInTheDocument();
      expect(within(launcher).queryByText(/approval-first/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText("3 actions ready")).toHaveTextContent("3 ready");
      fireEvent.click(screen.getByRole("button", { name: /open avara/i }));

      let input = screen.getByRole("textbox", { name: /avara/i });
      const panelOrb = document.querySelector(".avara-panel-orb");
      expect(panelOrb).toBeInTheDocument();
      expect(panelOrb).toHaveAttribute("data-state", "ready");
      expect(panelOrb?.querySelector(".avara-shard-front")).toBeInTheDocument();
      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByRole("textbox", { name: /avara/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /open avara/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /open avara/i }));
      input = screen.getByRole("textbox", { name: /avara/i });
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole("textbox", { name: /avara/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /open avara/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /open avara/i }));
      input = screen.getByRole("textbox", { name: /avara/i });
      const commandBar = screen.getByTestId("avara-command-bar");

      expect(commandBar).toHaveAttribute("data-state", "active");
      expect(input).toHaveAttribute("placeholder", "Ask Avara about leads, follow-ups, or opportunities...");
      expect(screen.getByText(/does not call a model/i)).toHaveStyle({ position: "absolute", width: "1px" });

      fireEvent.change(input, { target: { value: "Find leads that need follow-up today" } });
      expect(input).toHaveValue("Find leads that need follow-up today");

      fireEvent.click(screen.getByRole("button", { name: /preview avara response/i }));
      expect(commandBar).toHaveAttribute("data-state", "thinking");
      expect(screen.getByText("Checking lead context...")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(730);
      });
      expect(commandBar).toHaveAttribute("data-state", "splitting");
      expect(screen.getByText("Preparing recommended action...")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(570);
      });
      expect(commandBar).toHaveAttribute("data-state", "streaming");
      expect(screen.getByText("Composing draft...")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(commandBar).toHaveAttribute("data-state", "ready");
      expect(screen.getByText("Draft ready for approval...")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(360);
      });
      expect(screen.getByText("Pipeline result ready")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Clear")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
      const draftEditor = screen.getByRole("textbox", { name: /edit local avara action draft/i });
      fireEvent.change(draftEditor, { target: { value: "Edited local approval draft." } });
      expect(draftEditor).toHaveValue("Edited local approval draft.");

      fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
      expect(screen.queryByText("Pipeline result ready")).not.toBeInTheDocument();
      expect(commandBar).toHaveAttribute("data-state", "active");
    } finally {
      vi.useRealTimers();
    }
  });

  it("blooms internally when launcher actions become ready", () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();

    try {
      const { rerender } = render(<AvaraLauncher state="active" actionCount={0} onOpen={onOpen} />);
      const launcher = screen.getByRole("button", { name: /open avara/i });
      const launcherOrb = within(launcher).getByTestId("avara-crystal-orb");
      expect(launcher).toHaveAttribute("data-state", "active");
      expect(launcherOrb).toHaveAttribute("data-state", "active");
      expect(launcherOrb).not.toHaveAttribute("data-burst");

      rerender(<AvaraLauncher state="ready" actionCount={1} onOpen={onOpen} />);
      expect(launcherOrb).toHaveAttribute("data-burst", "ready");
      expect(screen.getByLabelText("1 action ready")).toHaveTextContent("1 ready");

      act(() => {
        vi.advanceTimersByTime(930);
      });
      expect(launcherOrb).not.toHaveAttribute("data-burst");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the clean Avara workspace chat and local approval preview", () => {
    vi.useFakeTimers();

    try {
      render(<AvaraShell variant="workspace" />);

      expect(screen.getByRole("region", { name: /avara chat workspace/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Avara" })).toBeInTheDocument();
      expect(document.querySelector(".avara-chat-orb .avara-shard")).toBeInTheDocument();
      expect(screen.getByText("Avara is live")).toBeInTheDocument();
      expect(screen.getByText(/I can review your lead pipeline through fixed read-only tools/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "What needs attention today?" })).toBeInTheDocument();

      const input = screen.getByRole("textbox", { name: /avara chat prompt/i });
      expect(input).toHaveAttribute(
        "placeholder",
        "Ask Avara about leads, follow-ups, or today's priorities...",
      );

      fireEvent.click(screen.getByRole("button", { name: "Which leads need follow-up?" }));
      expect(input).toHaveValue("Which leads need follow-up?");

      fireEvent.click(screen.getByRole("button", { name: /send avara prompt/i }));
      expect(screen.getAllByText("Checking lead context...").length).toBeGreaterThan(0);
      expect(screen.getByText("You")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2160);
      });

      expect(screen.getByText("Pipeline result ready")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Clear")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
