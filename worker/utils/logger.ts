type LogLevel = 'log' | 'error' | 'warn';

function formatTime(): string {
	return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
	return `[${level.toUpperCase()} ${formatTime()}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
}

export function log(level: LogLevel, message: string, ...args: any[]) {
	// Return early if not in development
	if (process.env.NODE_ENV !== 'development') {
		return;
	}

	const formattedMessage = formatMessage(level, message, ...args);

	switch (level) {
		case 'error':
			console.error(formattedMessage);
			break;
		case 'warn':
			console.warn(formattedMessage);
			break;
		default:
			console.log(formattedMessage);
	}
}

// Convenience methods
export const logger = {
	log: (message: string, ...args: any[]) => log('log', message, ...args),
	error: (message: string, ...args: any[]) => log('error', message, ...args),
	warn: (message: string, ...args: any[]) => log('warn', message, ...args),
};
