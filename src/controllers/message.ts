import { getMsgs } from '../models/message';

const onGetMessages = async (req: any, res: any) => {
	try {
		const { roomCode } = req.body;
		const messages = await getMsgs(roomCode);
		return res.status(200).json({
			status: 'success',
			data: { messages }
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			success: false,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			error: error.message
		});
	}
};

export default {
	onGetMessages
};
