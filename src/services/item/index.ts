import express, {Request, Response, NextFunction, CookieOptions} from "express";
import ItemModel from "./itemSchema";
import createError from "http-errors";
import {JWTAuthentication} from "../../library/authen/jwt";

import {v2 as cloudinary} from "cloudinary";
import {CloudinaryStorage} from "multer-storage-cloudinary";
import multer from "multer";
import { ItemType } from "../types";

const ItemRouter = express.Router();

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECTRET,
});

const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
});

const upload = multer({storage: storage}).array("item");

ItemRouter.post(
	"/",
	JWTAuthentication,
	upload,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const item = await JSON.parse(req.body.item);
			const image: string[] =[];

			req.files.map((img:any)=> image.push(img.path))
			const newItem = await new ItemModel({...item, images: image}).save();
			await req.user.items.push(newItem._id);
			await req.user.save();
			res.send(newItem);
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

ItemRouter.get(
	"/",
	JWTAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const items = await ItemModel.find().populate({
				path: "user",
				model: "User",
				select: {username: 1, image: 1},
			});
			const filtereItems = await items.filter((item:ItemType)=> item.status !== "gone")
			res.send(filtereItems);
		} catch (error) {
			next(error);
		}
	}
);

ItemRouter.put(
	"/:id",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			if (req.user._id == req.body.user) {
				const item = await ItemModel.findByIdAndUpdate(
					req.params.id,
					{...req.body},
					{runValidators: true, new: true}
				);
				if (item) {
					res.status(201).send(item);
				} else {
					next(
						createError(404, {
							Message: {
								message: "item not found",
							},
						})
					);
				}
			} else {
				next(
					createError(401, {
						message: {
							message: "Unauthorized",
						},
					})
				);
			}
		} catch (error: any) {
			next(error);
		}
	}
);

ItemRouter.delete(
	"/:id",
	JWTAuthentication,
	async (req: any, res: Response, next: NextFunction) => {
		try {
			const deleteItem = await ItemModel.findByIdAndDelete(req.params.id);
			if (deleteItem) {
				res.status(201).send({message: "Item delete successfully"});
			} else {
				res.status(404).send({message: "Item Not Found"});
			}
		} catch (error) {
			next(error);
		}
	}
);

export default ItemRouter;
