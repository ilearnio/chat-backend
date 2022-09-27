import { MessageStatus } from '../constants';
import { ChatMessage } from '../types';
import { getUserByUsername, User } from './user';
import knex from '../lib/knex';
import TableEnum from './tableNames';
import { randomId } from '../utils/strings';

export interface Message {
	id: string;
	content: string;
	status: string;
	isSystem: boolean;
	userId: string;
	roomCode: string;
}

export interface MessageDocument extends Message {
	createdAt: number;
	updatedAt: number;
}

export interface MessageExtended extends Omit<Message, 'userId'> {
	user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>;
}

export const createMsg = async (
	{ userRoom, content, isSystem = false, status = MessageStatus.SENT }: ChatMessage
): Promise<MessageExtended> => {
	const user = await getUserByUsername(isSystem ? 'Chatbot' : userRoom.name);
	if (!user) {
		throw { error: 'User not found' };
	}

	const message: Message = {
		id: await randomId(),
		content,
		isSystem,
		status,
		userId: user.id,
		roomCode: userRoom.room,
	};
	const [messageInserted] = await knex<MessageDocument>(TableEnum.messages)
		.insert(message)
		.returning('*');

	const { id, username, firstName, lastName } = user;
	const messageExtended: MessageExtended = {
		...messageInserted,
		user: { id, username, firstName, lastName },
	};

	return messageExtended;
};

export const getMsgs = async (roomCode: string) => {
	type Result = MessageDocument & Pick<User, 'firstName' | 'lastName' | 'username'>;
	const results: Result[] = await knex
		.select('m.*', 'u.firstName', 'u.lastName', 'u.username')
		.from(`${TableEnum.messages} AS m`)
		.join(`${TableEnum.users} AS u`, 'u.id', '=', 'm.userId')
		.where({ roomCode })
		.orderBy('m.createdAt', 'asc')
		.limit(1000);

	const messagesExtended: MessageExtended[] = results
		.map(({ userId, firstName, lastName, username, ...msg }) => {
			return {
				...msg,
				user: { id: userId, firstName, lastName, username },
			};
		});

	return messagesExtended;
};
