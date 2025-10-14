const isDev = process.env.NODE_ENV === 'development';
const url = process.env.WORKER_URL;
const siteData = {
	title: 'Link Shortener',
	shortUrl: isDev ? 'http://localhost:8787' : url ? url : 'https://links.alisanan9090.workers.dev',
	github: 'https://github.com/AliSanan/link-shortener',
} as const;

export default siteData;
