import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import navItems from '@/lib/nav-items';
import type { ApiResponse } from '@shared/types';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Nav() {
	const [pathname, setPathname] = useState<string>('');
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		typeof window !== undefined && setPathname(window.location.pathname);
		fetch('/api/me')
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				if (data.success) {
					setIsLoggedIn(true);
					setIsLoading(false);
				} else {
					setIsLoggedIn(false);
					setIsLoading(false);
				}
			})
			.catch(() => {
				setIsLoggedIn(false);
				setIsLoading(false);
			});
	}, []);

	function handleLogout() {
		fetch('/api/logout', { method: 'POST' })
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				data.success;
				setIsLoggedIn(false);
				window.location.href = '/login';
			})
			.catch((error) => toast.error('Error logging out', { description: error.message }));
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
						<button key={link.name} onClick={handleLogout}>
							Logout
						</button>
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
