import bcrypt from 'bcrypt';
import knex from '../lib/knex';
import { ERROR_MESSAGES } from '../constants';
import { randomId } from '../utils/strings';
import TableEnum from './tableNames';

export interface User {
	id: string;
	username: string;
	firstName: string;
	lastName?: string;
	email: string;
	password: string;
	isOnline: boolean;
}

export interface UserDocument extends User {
	createdAt: string;
	updatedAt: string;
}

export const getFullName = (user: User) => {
	return user.firstName + ' ' + user.lastName;
};

export const createUser = async (userDetails: Omit<User, 'id' | 'isOnline'>): Promise<UserDocument> => {
	const hash = await bcrypt.hash(userDetails.password, 10);
	const newUser: User = {
		...userDetails,
		id: await randomId(),
		password: hash,
		isOnline: true,
	};
	const [user]: UserDocument[] = await knex(TableEnum.users)
		.insert(newUser)
		.returning('*');
	return user;
};

export const checkAvailability = async (value: string, type: keyof User) => {
	if (!(['email', 'username', 'id'] as (keyof User)[]).includes(type)) {
		throw { error: 'Invalid type argument' };
	}
	const existingUser = await knex(TableEnum.users).where({ [type]: value }).limit(1).first();
	console.log('### existingUser', existingUser)
	return !existingUser;
};

export const changeLoginStatus = async (id: string, newValue: boolean) => {
	const [user] = await knex<UserDocument>(TableEnum.users)
		.update({ isOnline: newValue })
		.where({ id })
		.limit(1)
		.returning('*');
	console.log('### changeLoginStatus user', user)
	if (!user) throw { error: ERROR_MESSAGES.USER_NOT_FOUND };
	return user;
};

export const getUserByField = async (field: keyof User, value: string): Promise<UserDocument> => {
	const user = await knex(TableEnum.users).where({ [field]: value }).limit(1).first();
	return user;
};

export const getUserById = async (id: string): Promise<UserDocument> => {
	return getUserByField('id', id);
};

export const getUserByUsername = async (username: string): Promise<UserDocument> => {
	return getUserByField('username', username);
};

export const findByLogin = async (login: string): Promise<UserDocument> => {
	let user = await getUserByField('username', login);
	if (!user) {
		user = await getUserByField('email', login);
	}
	return user;
};

export const deleteUserById = async (id: string) => {
	return knex(TableEnum.users).delete().where({ id });
};

// TODO handling of deleted user's msgs and rooms
