export interface UserSocket {
	socketId: string;
	username: string;
	rooms: Array<string>;
}

const users: Array<UserSocket> = [];

export function socketJoinRoom(socketId: string, username: string, room: string) {
	const userIndex = users.findIndex((user) => user.socketId === socketId);
	if (userIndex > 0) {
		users[userIndex].rooms.push(room);
	} else {
		users.push({ socketId, username, rooms: [ room ] });
	}
	return users;
}

export function disconnect(socketId: string) {
	const userIndex = users.findIndex((user) => user.socketId === socketId);
	if (userIndex >= 0) {
		const newUsers = users.splice(userIndex, 1);
		return newUsers[0];
	}
}

export function socketLeaveRoom(room: string, username: string) {
	const socketIDs: Array<string> = [];
	users.forEach((user, i) => {
		if (user.username === username) {
			socketIDs.push(user.socketId);
			users[i].rooms = users[i].rooms.filter((currentRoom) => currentRoom !== room);
		}
	});
	return socketIDs;
}

export function countUserSockets(username: string) {
	return users.filter((user) => user.username === username).length;
}

export function socketDeleteRoom(room: string) {
	const socketIDs: Array<string> = [];
	users.forEach((user, i) => {
		if (user.rooms.includes(room)) {
			socketIDs.push(user.socketId);
			users[i].rooms = users[i].rooms.filter((currentRoom) => currentRoom !== room);
		}
	});
	return socketIDs;
}
