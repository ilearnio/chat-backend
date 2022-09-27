import cryptoRandomString from 'crypto-random-string';
import chunk from 'lodash.chunk';
import { User, UserDocument } from './user';
import knex from '../lib/knex';
import TableEnum from './tableNames';
import { ERROR_MESSAGES } from '../constants';

interface RoomUser {
	user: Pick<User, 'firstName' | 'lastName' | 'username' | 'email'>;
	unread: number;
}

export interface Room {
	code: string;
	ownerUserId: string;
	description: string;
	userCount: number;
	lastActivity?: Date;
	lastMessagePreview?: string;
}

export interface RoomDocument extends Room {
	createdAt: Date;
	updatedAt: Date;
}

export interface RoomExtended extends RoomDocument {
	users: RoomUser[];
}

export interface RoomUsersRelation {
	roomCode: string;
	userId: string;
	unread?: number;
}

export interface RoomUsersRelationDocument {
	roomCode: string;
	userId: string;
	unread: number;
}

export const createRoom = async (
	userId: string,
	description: string
) => {
	const code = cryptoRandomString({ length: 8, type: 'alphanumeric' });
	const room: Room = { code, ownerUserId: userId, description, userCount: 0 };
	await knex<RoomDocument>(TableEnum.rooms).insert(room);
	await joinRoom(code, userId);
	return code;
};

export const getRoomByCode = async (roomCode: string): Promise<RoomDocument | undefined> => {
	return knex<RoomDocument>(TableEnum.rooms).where({ code: roomCode }).limit(1).first();
};

export const getRoomExtended = async (roomCode: string): Promise<RoomExtended> => {
	const room = await getRoomByCode(roomCode);
	const users: (
		Pick<User, 'firstName' | 'lastName' | 'username' | 'email'> &
		{ unread: number }
	)[] = await knex
		.select('u.firstName', 'u.lastName', 'u.username', 'u.email', 'ru.unread')
		.from(`${TableEnum.users} AS u`)
		.join(`${TableEnum.room_users} AS ru`, 'ru.userId', '=', 'u.id')
		.where('ru.roomCode', '=', roomCode);
	const roomUsers: RoomUser[] = users.map(({ unread, ...user }) => {
		return { user, unread };
	});
	return { ...room, users: roomUsers };
};

export const getUserExtendedRooms = async (userId: string) => {
	const roomCodes: string[] = await knex(TableEnum.room_users).pluck('roomCode').where({ userId });
	const rooms: RoomExtended[] = [];
	for (const ch of chunk(roomCodes, 7)) {
		rooms.push(...await Promise.all(ch.map(getRoomExtended)));
	}
	return rooms;
};

export const getRoomUser = async (roomCode: string, userId: string): Promise<UserDocument> => {
	return knex.select('u.*')
		.from(`${TableEnum.users} AS u`)
		.join(`${TableEnum.room_users} AS ru`, 'ru.userId', '=', 'u.id')
		.where('u.id', '=', userId)
		.where('ru.roomCode', '=', roomCode)
		.limit(1)
		.first();
};

export const joinRoom = async (roomCode: string, userId: string) => {
	const relation: RoomUsersRelation = { roomCode, userId };
	await knex<RoomUsersRelation>(TableEnum.room_users).insert(relation);
	await knex<RoomDocument>(TableEnum.rooms)
		.where({ code: roomCode })
		.increment('userCount', 1)
		.update({ updatedAt: new Date() })
		.debug(true);
};

export const leaveRoom = async (roomCode: string, userId: string) => {
	const room = await getRoomByCode(roomCode);
	if (!room) {
		throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
	}

	const user = await getRoomUser(roomCode, userId);
	if (!user) {
		throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
	}

	if (room.userCount === 1) {
		await deleteRoom(room.code);
		return null;
	}

	const [[updatedRoom]] = await Promise.all([
		knex<RoomDocument>(TableEnum.rooms)
			.decrement('userCount', 1)
			.where({ code: roomCode })
			.returning('*')
			.limit(1),
		knex<RoomUsersRelation>(TableEnum.room_users)
			.delete()
			.where({ roomCode, userId })
			.limit(1),
	]);
	return updatedRoom;
};

export const updatePreview = async (roomCode: string, message: string) => {
	await knex<RoomDocument>(TableEnum.rooms).update({
		lastMessagePreview: message.slice(0, 40),
		lastActivity: new Date(),
	}).where({ code: roomCode });
	return getRoomExtended(roomCode);
};

export const updateUnread = async (unread: number, roomCode: string, userId: string) => {
	await knex<RoomUsersRelation>(TableEnum.room_users)
		.update('unread', unread)
		.where({ roomCode, userId });
};

export const deleteRoom = async (roomCode: string) => {
	await knex<RoomDocument>(TableEnum.rooms).delete().where({ code: roomCode });
};
