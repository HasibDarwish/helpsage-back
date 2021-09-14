import express, {Request, Response, NextFunction} from "express";
import createError from "http-errors";
import {v2 as cloudinary} from "cloudinary";
import {CloudinaryStorage} from "multer-storage-cloudinary";
import multer from "multer";

import UserModel from "./userSchema";
import basicAuthentication from "../../library/authen/basic";
import {JWTAuthentication} from "../../library/authen/jwt";
import {generatePairOfJwtToken} from "../../library/tools/jwt";
import {cookieOption} from "../types";

const UserRouter = express.Router();

UserRouter.post(
	"/register",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newUser = await new UserModel(req.body).save();
			newUser ? res.send(newUser._id) : next(createError(400, "Bad Request"));
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

UserRouter.get(
	"/login",
	basicAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			if (req.user) {
				const {accessToken, refreshToken} = await generatePairOfJwtToken(
					req.user
				);
				res.cookie("accessToken", accessToken, cookieOption);
				res.cookie("refreshToken", refreshToken, cookieOption);
				res.status(200).send(req.user);
			} else {
				next(createError(401, {Message: "Wrong Credentials"}));
			}
		} catch (error) {
			res.send(error);
		}
	}
);

UserRouter.get(
	"/logout",
	async (req: any, res: Response, next: NextFunction) => {
		try {
			res.clearCookie("accessToken", cookieOption);
			res.clearCookie("refreshToken", cookieOption);
			res.status(200).send("Good Buy");
		} catch (error) {
			res.send(error);
		}
	}
);

UserRouter.get(
	"/me",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			if (req.user) {
				const {accessToken, refreshToken} = await generatePairOfJwtToken(
					req.user
				);
				req.user.items = req.user.items?.filter(
					(item: any) => item.status === "available"
				);
				await req.user.save();
				res.cookie("accessToken", accessToken, cookieOption);
				res.cookie("refreshToken", refreshToken, cookieOption);
				res.status(200).send(req.user);
			} else {
				next(createError(401, {Message: "Wrong Credentials"}));
			}
		} catch (error) {
			res.send(error);
		}
	}
);

UserRouter.put(
	"/updateProfile",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const updatedUser = await UserModel.findByIdAndUpdate(
				req.user._id,
				{
					...req.body,
					password: req.user.password,
				},
				{runValidators: true, new: true}
			);
			updatedUser
				? res.send(updatedUser)
				: next(createError(400, "Bad Request"));
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

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECTRET,
});

const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
});

const upload = multer({storage: storage}).single("profile");

UserRouter.put(
	"/uploadProfile",
	JWTAuthentication,
	upload,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			req.user.image = req.file.path;
			await req.user.save();
			res.status(200).send("Profile image updated successfully");
		} catch (error: any) {
			console.log(error);
			next(error);
		}
	}
);

export default UserRouter;
