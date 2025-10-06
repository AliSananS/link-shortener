export type SignupRequest = {
	name: string;
	email: string;
	password: string;
};

export type LoginRequest = Omit<SignupRequest, 'name'>;
