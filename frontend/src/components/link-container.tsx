import LinkInput from '@/components/link-input';
import { useEffect, useState, type ChangeEventHandler } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type ApiResponse, type CreateLinkApiRequest, type Expiry, type GetLinkApiRequest, expireEntries } from '@shared/types';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { SHORTCODE_LENGTH } from '@shared/constants';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { shortCodeSchema } from '@shared/schemas';

const LinkContainer = ({ siteData }: { siteData: any }) => {
	const [longUrl, setLongUrl] = useState<string>('');
	const [expiry, setExpiry] = useState<Expiry>('never');
	const [isLoading, setIsLoading] = useState(false);
	const [shortUrlCode, setShortUrlCode] = useState<string>('');
	const [codeExists, setCodeExists] = useState<null | boolean>(null);
	const [isCheckingShortCode, setIsCheckingShortCode] = useState(false);
	const [shortCodeError, setShortCodeError] = useState<string | null>(null);

	useEffect(() => {
		setShortUrlCode(nanoid(SHORTCODE_LENGTH));
	}, []);

	async function handleCreateLink() {
		let url = longUrl;
		try {
			shortCodeSchema.parse(shortUrlCode);
		} catch (error) {
			if (error instanceof z.ZodError) {
				toast.error('Invalid short code', { description: error.issues[0].message });
				return;
			}
		}

		setIsLoading(true);

		if (!(url.startsWith('http://') || url.startsWith('https://'))) {
			url = 'http://' + url;
		}

		const payload: CreateLinkApiRequest = {
			shortCode: shortUrlCode,
			destination: url,
			expiresAt: expiry,
		};

		fetch('/api/create-link', {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((res) => res.json())
			.then((data: ApiResponse) => {
				if (data.success) {
					toast.success('Link created successfully!');
					setLongUrl('');
					setExpiry('never');
				} else {
					toast.error('Error creating link', { description: data.message || data.error || undefined });
				}
				setIsLoading(false);
			})
			.catch((error) => {
				toast.error('Network error, try again.', { description: error instanceof Error ? error.message : undefined });
			});
	}

	const shortUrlChangeHandler: ChangeEventHandler<HTMLInputElement> = async (e) => {
		const newCode = e.target.value;
		setShortUrlCode(newCode);
		setShortCodeError(null);

		try {
			shortCodeSchema.parse(newCode);
		} catch (error) {
			if (error instanceof z.ZodError) {
				setShortCodeError(error.issues[0].message);
				return;
			}
		}

		if (newCode.length === 0) return;
		setIsCheckingShortCode(true);

		setTimeout(() => {
			fetch('/api/get-link', {
				method: 'POST',
				body: JSON.stringify({
					shortCode: newCode,
				} satisfies GetLinkApiRequest),
			})
				.then((res) => res.json())
				.then((data: ApiResponse) => {
					if (data.success) {
						setCodeExists(data.code === 'FOUND');
						setIsCheckingShortCode(false);
					}
				})
				.catch((_) => {});
		}, 200);
	};

	const baseUrl = siteData.shortUrl.endsWith('/') ? siteData.shortUrl : `${siteData.shortUrl}/`;

	return (
		<div className="flex flex-col gap-8 items-center transition-all duration-300 ease-in-out">
			<LinkInput variant="long" longUrl={longUrl} onLongLinkChange={setLongUrl} />

			<div className="flex flex-row items-center justify-center gap-4 px-8 text-muted-foreground">
				<Separator />
				<p className="text-sm text-nowrap">Becomes 👇</p>
				<Separator />
			</div>
			<LinkInput
				variant="short"
				shortUrl={baseUrl}
				shortCode={shortUrlCode}
				className="self-center"
				onShortUrlChange={shortUrlChangeHandler}
			/>
			{isCheckingShortCode && <Spinner />}
			{shortCodeError && <p className="text-red-400">{shortCodeError}</p>}
			{!shortCodeError && codeExists !== null && shortUrlCode.length > 0 && !isCheckingShortCode && (
				<p className={`${codeExists ? 'text-red-400' : 'text-green-400'}`}>{`Code ${shortUrlCode} is ${
					codeExists ? 'not' : ''
				} available`}</p>
			)}

			{/* bottom */}
			<div className="flex flex-row justify-between items-end w-full">
				{/* expiry */}
				<div className="flex flex-col gap-4">
					<Label>Expires</Label>
					<Select value={typeof expiry === 'number' ? expiry.toString() : expiry} onValueChange={(v: string) => setExpiry(v as Expiry)}>
						<SelectTrigger className="cursor-pointer">
							<SelectValue>{expiry}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{expireEntries.map((entry) => (
									<SelectItem key={entry} value={entry}>
										{entry === 'never' ? entry : `After 1 ${entry}`}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<Button className="cursor-pointer" variant="default" size="lg" onClick={handleCreateLink}>
					{isLoading && <Spinner />}
					Create
				</Button>
			</div>
		</div>
	);
};

export default LinkContainer;
