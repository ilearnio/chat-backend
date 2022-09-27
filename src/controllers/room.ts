import { ChatEvent } from './../constants';
import { socketDeleteRoom, socketLeaveRoom } from '../utils/users';
import { ERROR_MESSAGES } from '../constants';
import {
	createRoom,
	deleteRoom,
	getRoomByCode,
	getRoomExtended,
	getRoomUser,
	getUserExtendedRooms,
	joinRoom,
	leaveRoom,
} from '../models/room';
import { getUserById } from '../models/user';
import { createMsg } from '../models/message';

const onGetRooms = async (req: any, res: any) => {
	try {
		const rooms = await getUserExtendedRooms(req.userId);
		return res.status(200).json({
			status: 'success',
			data: { rooms }
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

const onCreateRoom = async (req: any, res: any) => {
	try {
		const { description } = req.body;
		const roomCode = await createRoom(req.userId, description.trim());
		const newRoom = await getRoomExtended(roomCode);
		return res.status(201).json({
			status: 'success',
			data: { room: newRoom }
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

const onJoinRoom = async (req: any, res: any) => {
	try {
		const { roomCode } = req.body;
		const room = await getRoomByCode(roomCode);
		if (!room) {
			throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
		}

		const user = await getRoomUser(roomCode, req.userId);
		if (user) {
			throw new Error(ERROR_MESSAGES.USER_IN_ROOM);
		}

		await joinRoom(room.code, req.userId);
		const joinedRoom = await getRoomExtended(room.code);

		return res.status(200).json({
			status: 'success',
			data: { room: joinedRoom }
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

const onLeaveRoom = async (req: any, res: any) => {
	try {
		const { roomCode } = req.body;
		const userDetails = await getUserById(req.userId);

		const sockets = await req.app.get('io').sockets.sockets;
		const socketIDs = socketLeaveRoom(roomCode, userDetails.username);
		const currentSocket = await sockets.get(socketIDs[0]);
		await currentSocket.to(roomCode).emit(ChatEvent.LEAVE, { userDetails, leftRoom: roomCode });

		const room = await leaveRoom(roomCode, req.userId);

		if (room) {
			const newMsg = await createMsg({
				userRoom: { name: userDetails.username, room: roomCode },
				content: `${userDetails.username} left the room.`,
				isSystem: true
			});
			await currentSocket.to(roomCode).emit(ChatEvent.MESSAGE, { newMsg });
		}

		socketIDs.forEach((socketID, i) => {
			sockets.get(socketID).leave(roomCode);
		});
		return res.status(200).json({
			status: 'success'
		});
	} catch (error) {
		console.log('error:', error)
		return res.status(400).json({
			success: false,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			error: error.message
		});
	}
};

const onDeleteRoom = async (req: any, res: any) => {
	const { roomCode } = req.body;
	await deleteRoom(roomCode);

	const io = req.app.get('io');
	await io.to(roomCode).emit(ChatEvent.ROOM_DELETE, roomCode);
	const socketIDs = socketDeleteRoom(roomCode);
	socketIDs.forEach((socketID) => {
		io.sockets.sockets.get(socketID).leave(roomCode);
	});

	return res.status(200).json({
		status: 'success'
	});
};

export default { onGetRooms, onCreateRoom, onJoinRoom, onLeaveRoom, onDeleteRoom };
