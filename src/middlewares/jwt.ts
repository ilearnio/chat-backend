import jwt from 'jsonwebtoken';
import { changeLoginStatus, findByLogin, getUserById } from '../models/user';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../constants';

export const encode = async (req: any, res: any, next: any) => {
	try {
		const user = await findByLogin(req.body.username);
		if (user) {
			const matches = await bcrypt.compare(req.body.password, user.password);
			if (matches) {
				const authToken = jwt.sign(
					{
						userId: user.id
					},
					process.env.SECRET_KEY!
				);
				console.log('Auth', authToken);
				req.authToken = authToken;
				req.username = user.username;
				await changeLoginStatus(user.id, true);
				next();
			} else {
				return res.status(401).json({ success: false, message: ERROR_MESSAGES.UNAUTHORIZED });
			}
		} else {
			throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
		}
	} catch (error) {
		console.log(error);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return res.status(400).json({ success: false, message: error.message });
	}
};

export const decode = async (req: any, res: any, next: any) => {
	if (!req.headers['authorization']) {
		return res.status(401).json({ success: false, message: ERROR_MESSAGES.NO_TOKEN });
	}
	try {
		const accessToken = req.headers.authorization.split(' ')[1];
		const decoded: any = jwt.verify(accessToken, process.env.SECRET_KEY!);
		req.userId = decoded.userId;
		if (!await getUserById(req.userId)) {
			return res.status(401).json({ success: false, message: 'Unauthorized' });
		}
		return next();
	} catch (error) {
		console.log(error);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return res.status(401).json({ success: false, message: error.message });
	}
};
