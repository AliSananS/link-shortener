import { Spinner } from '@/components/ui/spinner';
import navItems from '@/lib/nav-items';
import type { ApiResponse } from '@shared/types';
import { use, useEffect, useState } from 'react';

export default function Nav() {
	const [pathname, setPathname] = useState<string>('');
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		typeof window !== undefined && setPathname(window.location.pathname);
		fetch('http://127.0.0.1:8787/api/me', { mode: 'no-cors' })
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
	return (
		<div className="flex flex-row justify-between items-center py-4 px-6 max-w-6xl w-full">
			{/* LOGO */}
			<a href="/" className="text-xl leading-7 font-bold text-foreground">
				Link Shortener
			</a>
			<div className="flex flex-row justify-end gap-4">
				{isLoading ? (
					<Spinner />
				) : (
					navItems
						.filter((link) => !(link.name === 'login' && isLoggedIn))
						.map((link) => (
							<a
								key={link.name}
								href={link.href}
								className={`text-base ${pathname.includes(link.href) ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'}`}
							>
								{link.title}
							</a>
						))
				)}
			</div>
		</div>
	);
}
