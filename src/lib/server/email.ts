import nodemailer from 'nodemailer';
import {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASSWORD,
	EMAIL_FROM,
	ORIGIN
} from '$env/static/private';

const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: Number(SMTP_PORT),
	secure: false,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASSWORD
	}
});

export async function sendVerificationEmail(email: string, token: string) {
	const url = `${ORIGIN}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

	await transporter.sendMail({
		from: EMAIL_FROM,
		to: email,
		subject: 'Verify your email address',
		html: `
			<h2>Email Verification</h2>
			<p>Click the link below to verify your email address:</p>
			<p><a href="${url}">Verify Email</a></p>
			<p>This link expires in 24 hours.</p>
			<p>If you didn't create an account, you can safely ignore this email.</p>
		`
	});
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const url = `${ORIGIN}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

	await transporter.sendMail({
		from: EMAIL_FROM,
		to: email,
		subject: 'Reset your password',
		html: `
			<h2>Password Reset</h2>
			<p>Click the link below to reset your password:</p>
			<p><a href="${url}">Reset Password</a></p>
			<p>This link expires in 24 hours.</p>
			<p>If you didn't request a password reset, you can safely ignore this email.</p>
		`
	});
}
