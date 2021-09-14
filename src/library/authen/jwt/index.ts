import createError from "http-errors";

import {RequestType} from "../../types/";
import {verifyJwtToken} from "../../tools/jwt";
import UserModel from "../../../services/user/userSchema";

export const JWTAuthentication: RequestType = async (req, res, next) => {
	if (!req.cookies.accessToken) {
		next(createError(401, {Message: "Please Provide Credentials"}));
	} else {
		try {
			const targetUser = await verifyJwtToken(req.cookies.accessToken);
			const user = await UserModel.findById(targetUser._id)
				.populate({
					path: "items",
					model: "Item",
					populate: {
						path: "user",
						model: "User",
						select: {firstName: 1, image: 1},
					},
				}).populate({
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
			if (user) {
				req.user = user;
				next();
			} else {
				next(createError(404, {Message: "User not found"}));
			}
		} catch (error) {
			next(createError(401, {Message: "token is not valid"}));
		}
	}
};
