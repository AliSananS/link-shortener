import z from 'zod';

export const shortCodeSchema = z
	.string()
	.min(1, "Short code can't be empty")
	.refine((val) => val.trim().length > 0, "Short code can't be just spaces")
	.refine((val) => !/^[0-9]+$/.test(val), "Short code can't be just numbers")
	.refine((val) => !/[/?#]/.test(val), "Short code can't contain /, ? or # characters");
