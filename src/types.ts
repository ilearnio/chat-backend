export interface UserRoom {
	name: string; // username
	room: string;
}

export interface ChatMessage {
	userRoom: UserRoom;
	content: string;
	status?: string;
	isSystem?: boolean;
}
