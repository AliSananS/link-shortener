'use client';
import siteData from '@/siteData';
import LinkItem from '@/components/link-item';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type ApiResponse, type CreateLinkRequest, type Expiry, expireEntries } from '@shared/types';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { SHORTCODE_LENGTH } from '@shared/constants';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const LinkContainer = () => {
	const [longLink, setLongLink] = useState<string>('');
	const [expiry, setExpiry] = useState<Expiry>('never');
	const [randomCode, setRandomCode] = useState<string>(nanoid(6));

	useEffect(() => {
		setRandomCode(nanoid(SHORTCODE_LENGTH));
	}, []);

	async function handleCreateLink() {
		const payload: CreateLinkRequest = {
			shortCode: randomCode,
			destination: longLink,
			expiresAt: expiry,
		};
		const res = await fetch('/api/create-link', {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!res.ok) {
			const data = await res.json();
			toast.error(data.error || 'Failed to create link', { description: data.message });
		}

		const data = (await res.json()) as ApiResponse<string, string>;
		if (data.success) {
			toast.success('Link created successfully!');
			setLongLink('');
			setExpiry('never');
		}
	}

	const shortUrl = new URL(siteData.shortUrl);

	shortUrl.pathname = randomCode;

	return (
		<div className="flex flex-col gap-8 items-center transition-all duration-300 ease-in-out">
			<LinkItem variant="long" longUrl={longLink} onLongLinkChange={setLongLink} />

			<div className="flex flex-row items-center justify-center gap-4 px-8 text-muted-foreground">
				<Separator />
				<p className="text-sm text-nowrap">Becomes 👇</p>
				<Separator />
			</div>
			<LinkItem variant="short" shortUrl={shortUrl} className="self-center" />

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
					Create
				</Button>
			</div>
		</div>
	);
};

export default LinkContainer;
