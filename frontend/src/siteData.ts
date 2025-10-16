const isDev = process.env.NODE_ENV === 'development';
const url = process.env.WORKER_URL;
const siteData = {
	title: 'Link Shortener',
	shortUrl: isDev ? 'localhost:8787' : url ? url : 'links.alisanan9090.workers.dev',
	github: 'https://github.com/AliSananS/link-shortener',
} as const;

export default siteData;
