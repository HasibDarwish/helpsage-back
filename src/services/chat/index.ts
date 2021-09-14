import express, {Request, Response, NextFunction, CookieOptions} from "express";
import createError from "http-errors";

import {JWTAuthentication} from "../../library/authen/jwt";
import ChatModel from "./chatSchema";
import UserModel from "../user/userSchema";
import {ChatTypes} from "../types";

const ChatRouter = express.Router();

ChatRouter.post(
	"/",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const newChat: any = await new ChatModel(req.body).save();
			const otherParticipantId = await newChat.participants.find(
				(id: any) => id.toString() !== req.user._id.toString()
			);
			await UserModel.findByIdAndUpdate(otherParticipantId, {
				$push: {chats: newChat._id},
			});
			req.user.chats.push(newChat._id);
			req.user.save();
			res.send(newChat);
		} catch (error: any) {
			if (error.name === "MongoError")
				next(
					createError(400, {
						message: {
							error: error.keyValue,
							reason: "Duplicated key",
							advice: "Change the key value",
						},
					})
				);
			else if (error.name === "ValidationError")
				next(createError(400, {message: {Message: error.message}}));
			else next(createError(500, {message: error.message}));
		}
	}
);

ChatRouter.get(
	"/all",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const user = await UserModel.findById(req.user._id).populate({
				path: "chats",
				model: "Chat",
				populate: [
					{
						path: "participants",
						model: "User",
						select: {username: 1, image: 1, _id: 1},
					},
					{
						path: "item",
						model: "Item",
						select: {images: 1, description: 1, status: 1},
					},
					{
						path: "history",
						populate: {
							path: "user",
							model: "User",
							select: {username: 1, image: 1, _id: 1},
						},
					},
				],
			});

			res.send(user?.chats);
		} catch (error) {
			next(error);
		}
	}
);
ChatRouter.delete(
	"/:id",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			console.log(req.user._id);
			console.log(req.params.id);
			await UserModel.findByIdAndUpdate(req.user._id, {
				$pull: {chats: req.params.id},
			});
			res.send("Chat deleted successfully");
		} catch (error) {
			next(error);
		}
	}
);

ChatRouter.post(
	"/:id/msg",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const msg = await ChatModel.findByIdAndUpdate(
				req.params.id,
				{
					$push: {history: req.body},
				},
				{new: true}
			);

			res.send(msg.history[msg.history.length - 1]);
		} catch (error: any) {
			if (error.name === "MongoError")
				next(
					createError(400, {
						message: {
							error: error.keyValue,
							reason: "Duplicated key",
							advice: "Change the key value",
						},
					})
				);
			else if (error.name === "ValidationError")
				next(createError(400, {message: {Message: error.message}}));
			else next(createError(500, {message: error.message}));
		}
	}
);

ChatRouter.delete(
	"/:id/msg/:msgId",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			console.log(req.params.id);
			console.log(req.params.msgId);
			await ChatModel.findByIdAndUpdate(req.params.id, {
				$pull: {history: {_id: req.params.msgId}},
			});
			res.send("Message deleted successfully");
		} catch (error) {
			next(error);
		}
	}
);

export default ChatRouter;
