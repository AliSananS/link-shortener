const isDev = process.env.NODE_ENV === 'development';
const siteData = {
	title: 'Link Shortener',
	shortUrl: isDev ? 'http://localhost:8787' : 'https://link-shortener.alisanan9090.workers.dev',
	github: 'https://github.com/AliSanan/link-shortener',
} as const;

export default siteData;
