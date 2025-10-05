'use client';
import siteData from '@/siteData';
import LinkItem from '@/components/link-item';
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type Expiry, expireEntries } from '@/types';
import { Button } from '@/components/ui/button';

const LinkContainer = () => {
	const [isShortened, setIsShortened] = useState<boolean>(false);
	const [longLink, setLongLink] = useState<string>('');
	const [expiry, setExpiry] = useState<Expiry>('never');

	const shortUrl = new URL(siteData.shortUrl);

	const shortLink = (shortUrl.pathname = 'ADFKjj');

	return (
		<div className="flex flex-col gap-8">
			<LinkItem variant={isShortened ? 'short' : 'long'} onValueChange={(e) => setLongLink(e.target.value)} shortUrl={shortUrl} />
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
				<Button className="cursor-pointer" variant="default" size="lg">
					Create
				</Button>
			</div>
		</div>
	);
};

export default LinkContainer;
