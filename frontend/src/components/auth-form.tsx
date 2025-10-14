import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { ApiResponse, SignupResponseError, LoginResponseError } from '@shared/types';

const VALIDATION_RULES = [
	{
		message: 'Password must be at least 8 characters',
		displayText: 'At least 8 characters',
		validation: (s: string) => s.length >= 8,
	},
	{
		message: 'Password must contain at least one uppercase letter',
		displayText: 'One uppercase letter',
		validation: (s: string) => /[A-Z]/.test(s),
	},
	{
		message: 'Password must contain at least one lowercase letter',
		displayText: 'One lowercase letter',
		validation: (s: string) => /[a-z]/.test(s),
	},
	{
		message: 'Password must contain at least one number',
		displayText: 'One number',
		validation: (s: string) => /[0-9]/.test(s),
	},
];

const passwordSchema = z.string().superRefine((password, ctx) => {
	const failedRules = VALIDATION_RULES.filter((rule) => !rule.validation(password));
	failedRules.forEach((rule) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: rule.message,
		});
	});
});

export default function AuthForm() {
	const [isLogin, setIsLogin] = useState(true);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

	useEffect(() => {
		const result = passwordSchema.safeParse(password);
		if (!result.success) {
			setPasswordErrors(result.error.issues.map((issue) => issue.message));
		} else {
			setPasswordErrors([]);
		}
	}, [password]);

	const onSubmit = async () => {
		if (isLoading) return; // prevent double submits
		setIsLoading(true);

		// Basic client-side validation
		if (!email || !password || (!isLogin && !name)) {
			toast.error('Please fill in all required fields.');
			setIsLoading(false);
			return;
		}

		if (!isLogin && passwordErrors.length > 0) {
			// give the user a clear summary of what's failing
			toast.error(`Password does not meet requirements: ${passwordErrors.join(', ')}`);
			setIsLoading(false);
			return;
		}

		const endpoint = isLogin ? '/api/login' : '/api/signup';
		const payload = isLogin ? { email, password } : { email, password, name };

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // ensure cookies (Set-Cookie) are accepted
				body: JSON.stringify(payload),
			});

			// try to parse JSON, but handle non-JSON responses gracefully
			let data: ApiResponse<unknown, SignupResponseError | LoginResponseError> | null = null;
			try {
				data = await response.json();
			} catch (err) {
				console.warn('Failed to parse JSON response', err);
			}

			// Helper to show server-side code messages
			const handleServerError = (code?: SignupResponseError | LoginResponseError, errMsg?: string) => {
				switch (code) {
					// signup errors
					case 'MISSING_CREDENTIALS':
						toast.error('Missing required fields. Please check your input.');
						break;
					case 'INVALID_EMAIL':
						toast.error('Please provide a valid email address.');
						break;
					case 'EMAIL_EXISTS':
						toast.error('An account with this email already exists. Try logging in or reset your password.');
						break;
					case 'WEAK_PASSWORD':
						toast.error('Password is too weak. Please follow the password requirements.');
						break;
					case 'TOO_MANY_ATTEMPTS':
						toast.error('Too many attempts. Please try again later.');
						break;
					// login errors
					case 'EMAIL_NOT_FOUND':
					case 'INVALID_CREDENTIALS':
						toast.error('Invalid email or password.');
						break;
					case 'USER_DISABLED':
						toast.error('This account is disabled. Contact support.');
						break;
					default:
						if (errMsg) toast.error(errMsg);
						else toast.error('An unexpected error occurred. Please try again.');
				}
			};

			if (!response.ok) {
				// prefer structured server code when available
				if (data) {
					handleServerError(data.code as SignupResponseError | LoginResponseError, data.error || data.message);
				} else {
					toast.error(`Request failed with status ${response.status}.`);
				}
				setIsLoading(false);
				return;
			}

			// success path
			if (data && data.success) {
				toast.success(data.message || (isLogin ? 'Logged in successfully!' : 'Account created successfully!'));
				if (!isLogin) {
					// after signup redirect to home so server-set cookie is sent on next requests
					setTimeout(() => (window.location.href = '/'), 400);
				} else {
					// on login, reload page or navigate to dashboard
					setTimeout(() => (window.location.href = '/'), 200);
				}
			} else {
				// some servers may return 2xx but indicate failure in body
				if (data) {
					handleServerError(data.code as SignupResponseError | LoginResponseError, data.error || data.message);
				} else {
					toast.error('Received unexpected response from server.');
				}
			}
		} catch (error) {
			console.error('Error during submission:', error);
			toast.error('Failed to connect to the server. Please try again later.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>{isLogin ? 'Login to your account' : 'Signup for a new account'}</CardTitle>
				<CardDescription>
					{isLogin ? 'Enter your email below to login to your account' : 'Enter your details to create your new account.'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
				>
					<div className="flex flex-col gap-6">
						{!isLogin && (
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input id="name" type="text" placeholder="John Doe" required onChange={(v) => setName(v.target.value)} />
							</div>
						)}
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" placeholder="m@example.com" required onChange={(v) => setEmail(v.target.value)} />
						</div>
						<div className="grid gap-2">
							<div className="flex items-center">
								<Label htmlFor="password">Password</Label>
								<a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline"></a>
							</div>
							<Input
								id="password"
								type="password"
								required
								onChange={(v) => setPassword(v.target.value)}
								className={passwordErrors.length > 0 ? 'border-red-500' : ''}
							/>
							{password && !isLogin && (
								<ul className="text-sm mt-2 space-y-1">
									{VALIDATION_RULES.map((rule) => (
										<li
											key={rule.message}
											className={`flex items-center gap-2 ${!passwordErrors.includes(rule.message) ? 'text-green-500' : 'text-red-500'}`}
										>
											{!passwordErrors.includes(rule.message) ? '✓' : '✗'} {rule.displayText}
										</li>
									))}
								</ul>
							)}
						</div>
						<Button type="submit" className="w-full" disabled={(passwordErrors.length > 0 && !isLogin) || isLoading}>
							{isLoading && <Spinner />}
							{isLogin ? 'Login' : 'Sign up'}
						</Button>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex-col gap-8">
				<Separator />
				<Button variant="outline" className="w-full" onClick={() => setIsLogin(!isLogin)}>
					{isLogin ? 'Create new account' : 'Back to login'}
				</Button>
			</CardFooter>
		</Card>
	);
}
