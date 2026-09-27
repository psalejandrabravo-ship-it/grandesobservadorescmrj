import { Component, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/game/Game";

export const Route = createFileRoute("/")({ component: Home });

class GameGuard extends Component<{ children: ReactNode }, { n: number; failed: boolean }> {
  state = { n: 0, failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center text-indigo">
          <p className="text-xl font-extrabold">Se interrumpió esta parte del juego.</p>
          <button
            type="button"
            className="min-h-12 rounded-full bg-coral px-5 font-extrabold text-paper"
            onClick={() => this.setState({ failed: false, n: this.state.n + 1 })}
          >
            Continuar
          </button>
        </main>
      );
    }
    return <div key={this.state.n}>{this.props.children}</div>;
  }
}

function Home() {
  return (
    <GameGuard>
      <Game />
    </GameGuard>
  );
}