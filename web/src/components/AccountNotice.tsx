import { Link } from "@tanstack/react-router";

export function AccountNotice({ action }: { action: string }) {
  return (
    <div className="zine bg-secondary p-5 text-secondary-foreground">
      <p className="mb-3 font-bold">Влез, за да {action}.</p>
      <Link
        to="/join"
        className="zine-pink jitter inline-block bg-ink px-4 py-2 font-heavy text-xl text-paper"
      >
        ВХОД / РЕГИСТРАЦИЯ
      </Link>
    </div>
  );
}
