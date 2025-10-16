import { cn } from '@/lib/utils';
import { Copy, Clipboard, Check } from 'lucide-react';
import { type ChangeEventHandler, type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { type ClassNameValue } from 'tailwind-merge';

type Props = {
	variant: 'long' | 'short';
	shortUrl?: string;
	shortCode?: string;
	longUrl?: string;
	longPlaceholder?: string;
	className?: ClassNameValue;
	onLongLinkChange?: (change: string) => void;
	onShortUrlChange?: ChangeEventHandler<HTMLInputElement>;
};

const LinkInput = ({
	variant,
	shortUrl,
	shortCode,
	longUrl,
	longPlaceholder = 'Paste long link here...',
	className,
	onLongLinkChange,
	onShortUrlChange,
}: Props) => {
	const variants = {
		long: 'text-muted-foreground font-normal truncate',
		short: 'text-lg font-bold min-w-fit cursor-pointer',
	} as const;
	const [isCopyVisible, setIsCopyVisible] = useState(true);
	const [isCheckVisible, setIsCheckVisible] = useState(false);

	const icons = {
		short: (
			<button
				className={`cursor-pointer *:outline-none hover:scale-95`}
				onClick={() => {
					shortUrl &&
						navigator.clipboard
							.writeText(`${shortUrl}${shortCode}`)
							.then(() => toast.success('Copied to clipboard!'))
							.catch(() => toast.error('Failed to copy'));

					setIsCopyVisible(false);
					setTimeout(() => setIsCheckVisible(true), 200);
					setTimeout(() => {
						setIsCopyVisible(true);
						setIsCheckVisible(false);
					}, 3000);
				}}
			>
				{isCheckVisible ? (
					<Check size={24} className={`transition-all duration-200 ease text-green-500 ${isCheckVisible ? 'scale-100' : 'scale-0'}`} />
				) : (
					<Copy size={24} className={`transition-all duration-200 ease ${isCopyVisible ? 'scale-100' : 'scale-0'}`} />
				)}
			</button>
		),
		long: (
			<button
				aria-label="Paste from clipboard"
				className="focus:outline-none cursor-pointer"
				onClick={async () => {
					const text = await navigator.clipboard.readText();
					onLongLinkChange && onLongLinkChange(text);
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
					{shortUrl}
					<input
						autoCorrect="off"
						spellCheck={false}
						className="text-muted-foreground [*]:bg-transparent [*]:ring-0 outline-0 border-none resize-none hover:underline w-20"
						value={shortCode || ''}
						onChange={onShortUrlChange}
					/>
				</div>
			) : (
				<input
					onChange={(e) => onLongLinkChange && onLongLinkChange(e.currentTarget.value)}
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

export default LinkInput;
