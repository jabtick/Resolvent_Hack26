import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
export function AccountNotice({ action }: { action: string }) {
  return <div className="border-y-[3px] border-ink bg-secondary p-5 text-secondary-foreground"><p className="mb-3 font-bold">Sign in to {action}.</p><Button asChild variant="outline"><Link to="/join">Sign up / Log in</Link></Button></div>;
}