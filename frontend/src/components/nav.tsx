import { Button } from '@/components/ui/button';
import navItems from '@/lib/nav-items';
import type { ApiResponse } from '@shared/types';
import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export default function Nav() {
	const [pathname, setPathname] = useState<string>('');
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	useEffect(() => {
		typeof window !== undefined && setPathname(window.location.pathname);
		fetch('/api/me')
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				if (data.success) {
					setIsLoggedIn(true);
				} else {
					setIsLoggedIn(false);
				}
			})
			.catch(() => {
				setIsLoggedIn(false);
			});
	}, []);

	function handleLogout() {
		setIsLoading(true);
		fetch('/api/logout', { method: 'POST' })
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				data.success;
				setIsLoggedIn(false);
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
				{navItems.map((link) =>
					link.name === 'login' && isLoggedIn ? (
						<Dialog key={link.name} open={isDialogOpen}>
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
							key={link.name}
							href={link.href}
							className={`text-base ${pathname.includes(link.href) ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'}`}
						>
							{link.title}
						</a>
					)
				)}
			</div>
		</div>
	);
}
