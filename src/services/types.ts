import { CookieOptions } from "express";

interface MessageType {
	_id: string;
	user: string;
	text: string;
}

export interface ChatTypes {
	_id: string;
	participants: string[];
	item: string[];
	history: MessageType[];
}


export interface ItemType {
	_id: string;
	description: string;
	images: string;
	user: string;
	status: string;
}

interface AddressType {
	postcode: string | number;
	city: string;
	country: string;
}

export interface UserType {
	username: string;
	firstName: string;
	email: string;
	password?: string;
	image?: string;
	address?: AddressType;
	chats?: ChatTypes[];
	items?: ItemType[];
	refreshToken?: string;
}




export const cookieOption: CookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: "none",
};