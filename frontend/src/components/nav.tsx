import { Button } from '@/components/ui/button';
import type { ApiResponse } from '@shared/types';
import { useEffect, useState } from 'react';
import navItems from '@/lib/nav-items';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { isLoggedIn, isCheckingSession } from '@/store';
import { useStore } from '@nanostores/react';

export default function Nav() {
	const [pathname, setPathname] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const $isLoggedIn = useStore(isLoggedIn);
	const $isCheckingSession = useStore(isCheckingSession);

	useEffect(() => {
		typeof window !== undefined && setPathname(window.location.pathname);
	}, []);

	function handleLogout() {
		setIsLoading(true);
		fetch('/api/logout', { method: 'POST' })
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				data.success;
				isLoggedIn.set(false);
				window.location.href = '/login';
				setIsLoading(false);
				setIsDialogOpen(false);
			})
			.catch((error) => {
				toast.error('Error logging out', { description: error.message });
				setIsLoading(false);
				setIsDialogOpen(false);
			});
	}
	return (
		<div className="flex flex-row justify-between items-center py-4 px-6 max-w-6xl w-full">
			{/* LOGO */}
			<a href="/" className="text-xl leading-7 font-bold text-foreground">
				Link Shortener
			</a>
			<div className="flex flex-row justify-end gap-4 [&>*]:cursor-pointer [&>*]:hover:underline">
				{/* Main navigation items */}
				{navItems.map((link) => (
					<a
						key={link.name}
						href={link.href}
						className={`text-base ${pathname.includes(link.href) ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'}`}
					>
						{link.title}
					</a>
				))}

				{/* Auth button with loading state */}
				<div className="w-16 flex justify-end">
					{$isCheckingSession ? (
						<div className="flex items-center justify-center">
							<Spinner />
						</div>
					) : $isLoggedIn ? (
						<Dialog open={isDialogOpen}>
							<DialogTrigger>
								<button className="text-base cursor-pointer hover:underline" onClick={() => setIsDialogOpen(true)}>
									Logout
								</button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Confirm Logout</DialogTitle>
									<DialogDescription>Are you sure you want to logout? You'll need to log in again to access your links.</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
										Cancel
									</Button>
									<Button variant="destructive" onClick={handleLogout}>
										{isLoading && <Spinner />}
										Logout
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					) : (
						<a
							href="/login"
							className={`text-base ${pathname.includes('/login') ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'}`}
						>
							Login
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
