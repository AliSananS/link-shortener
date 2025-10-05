import navItems from '@/lib/nav-items';
import { use, useEffect, useState } from 'react';

export default function Nav() {
	const [pathname, setPathname] = useState<string>('');

	useEffect(() => {
		typeof window !== undefined && setPathname(window.location.pathname);
	});
	return (
		<div className="flex flex-row justify-between items-center py-4 px-6 max-w-6xl w-full">
			{/* LOGO */}
			<a href="/" className="text-xl leading-7 font-bold text-foreground">
				Link Shortener
			</a>
			<div className="flex flex-row justify-end gap-4">
				{navItems.map((link) => (
					<a
						key={link.name}
						href={link.href}
						className={`text-base ${pathname.includes(link.href) ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'}`}
					>
						{link.title}
					</a>
				))}
			</div>
		</div>
	);
}
