import { changeLoginStatus, checkAvailability, createUser, deleteUserById, getUserById } from '../models/user';

export default {
	// onGetAllUsers: async (req: any, res: any) => {
	// 	try {
	// 		const users = await User.getUsers();
	// 		return res.status(200).json({ success: true, users });
	// 	} catch (error) {
	// 		console.log(error);
	// 		return res.status(400).json({ success: false, error: error.message });
	// 	}
	// },
	onGetUserById: async (req: any, res: any) => {
		try {
			const user = await getUserById(req.params.id);
			return res.status(200).json({ success: true, user });
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return res.status(400).json({ success: false, error: error.message });
		}
	},
	onCheckAvailability: async (req: any, res: any) => {
		try {
			const { value, type } = req.body;
			const isAvailable = await checkAvailability(value, type);
			return res.status(201).json({ success: true, isAvailable });
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return res.status(400).json({ success: false, error: error.message });
		}
	},
	changeLoginStatus: async (req: any, res: any) => {
		try {
			const { newValue } = req.body;
			const updatedUser = await changeLoginStatus(req.userId, newValue);
			return res.status(200).json({ success: true, user: updatedUser });
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return res.status(400).json({ success: false, error: error.message });
		}
	},
	onCreateUser: async (req: any, res: any) => {
		try {
			await createUser(req.body);
			return res.status(201).json({ success: true });
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return res.status(400).json({ success: false, error: error.message });
		}
	},
	onDeleteUserById: async (req: any, res: any) => {
		try {
			const user = await getUserById(req.params.id);
			await deleteUserById(req.params.id);
			return res.status(200).json({
				success: true,
				message: `Deleted user: ${user.username}.`
			});
		} catch (error) {
			console.log(error);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return res.status(400).json({ success: false, error: error.message });
		}
	}
};
