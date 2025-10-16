import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
type SiteData = {
	title: string;
	shortUrl: string;
	github: string;
};

export default function LandingPage({ siteData }: { siteData: SiteData }) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 gap-8">
			<div className="flex flex-col items-center text-center gap-4">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold ">Lightning-Fast🔥 Link Shortening</h1>
				<p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
					Experience <span className="text-orange-300">millisecond</span> redirects with our <strong>edge-powered</strong> link shortener.
					Built for speed, deployed globally, and ready to make your links instant.
				</p>
				<div className="flex gap-4 mt-4">
					<Button size="lg" asChild>
						<a href="/login">Get Started</a>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<a href={siteData.github} target="_blank" rel="noopener noreferrer">
							View on GitHub
						</a>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
				<Card>
					<CardHeader>
						<CardTitle>Edge-Powered Speed</CardTitle>
						<CardDescription>
							Redirects in milliseconds using Cloudflare's global edge network for instant response worldwide
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Zero Cold Starts</CardTitle>
						<CardDescription>Always hot and ready to serve, no waiting for servers to wake up or warm up</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Global Performance</CardTitle>
						<CardDescription>Deployed across 300+ data centers for the lowest possible latency everywhere</CardDescription>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
