'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Copy, Clipboard } from 'lucide-react';
import { type ChangeEvent, type ChangeEventHandler, type ReactNode, useRef } from 'react';
import { toast } from 'sonner';
import { type ClassNameValue } from 'tailwind-merge';

type Props = {
	variant: 'long' | 'short';
	shortUrl?: URL;
	longUrl?: string;
	longPlaceholder?: string;
	className?: ClassNameValue;
	onLongLinkChange?: (change: string) => void;
};

const LinkItem = ({
	variant,
	shortUrl,
	longUrl,
	longPlaceholder = 'Paste long link here...',
	className,
	onLongLinkChange: onValueChange,
}: Props) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const variants = {
		long: 'text-muted-foreground font-normal truncate',
		short: 'text-lg font-bold min-w-fit cursor-pointer hover:scale-105',
	} as const;

	const icons = {
		short: (
			<button
				className="cursor-pointer *:outline-none"
				onClick={() => {
					shortUrl &&
						navigator.clipboard
							.writeText(shortUrl?.href.toString())
							.then(() => toast.success('Copied to clipboard!'))
							.catch(() => toast.error('Failed to copy'));
				}}
			>
				<Copy size={24} />
			</button>
		),
		long: (
			<button
				aria-label="Paste from clipboard"
				className="focus:outline-none cursor-pointer"
				onClick={async () => {
					const text = await navigator.clipboard.readText();
					onValueChange && onValueChange(text);
				}}
			>
				<Clipboard size={24} />
			</button>
		),
	} as Record<typeof variant, ReactNode>;

	return (
		<div
			className={cn(
				'flex flex-row bg-neutral-50 gap-4 px-6 py-4 items-center justify-between text-foreground max-w-[500px] min-w-96 rounded-full transition-all duration-300 ease-in-out dark:bg-background dark:border-sidebar-border dark:border-1',
				variants[variant],
				className
			)}
		>
			{variant === 'short' && shortUrl ? (
				<div className="flex flex-row gap-0 items-center">
					{shortUrl.origin}
					<span className="text-muted-foreground">{shortUrl.pathname}</span>
				</div>
			) : (
				<input
					onChange={(e) => onValueChange && onValueChange(e.currentTarget.value)}
					placeholder={longPlaceholder}
					value={longUrl}
					className="[*]:bg-transparent [*]:ring-0 outline-0 border-none resize-none text-2xl shadow-none w-full"
					style={{ fontSize: 16 }}
				/>
			)}
			{icons[variant]}
		</div>
	);
};

export default LinkItem;
