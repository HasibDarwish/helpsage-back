import mongoose, {Model} from "mongoose";
import bcrypt from "bcrypt";

import {UserType} from "../types";
const {Schema, model} = mongoose;

interface UserModel extends Model<UserType> {
	checkCredentials(email: string, password: string): {} | null;
}

const UserSchema = new Schema<UserType, UserModel, any>({
	username: {type: String, required: true},
	firstName: {type: String, required: true},
	email: {type: String, required: true, unique: true},
	password: {type: String},
	image: {type: String, default: "https://source.unsplash.com/random"},
	address: {
		postcode: {type: String || Number,},
		city: {type: String},
		country: {type: String},
	},
	chats: [{type: mongoose.Types.ObjectId, ref: "Chat"}],
	items: [{type: mongoose.Types.ObjectId, ref: "Item"}],
	refreshToken: {type: String},
});

UserSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.__v;
	delete userObject.password;
	delete userObject.refreshToken;

	return userObject;
};

UserSchema.pre("save", async function () {
	const newUser = this;
	if (newUser.isModified("password")) {
		newUser.password = await bcrypt.hash(newUser.password!, 7);
	}
});

UserSchema.static(
	"checkCredentials",
	async function checkCredentials(email: string, password: string) {
		const user = await this.findOne({email: email})
			.populate({
				path: "items",
				model: "Item",
				populate: {
					path: "user",
					model: "User",
					select: {username: 1, image: 1},
				},
			})
			.populate({
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
							select: {username: 1, image: 1,_id:1},
						},
					},
				],
			});

		if (user) {
			const isPasswordMatch = await bcrypt.compare(password, user.password!);
			if (isPasswordMatch) {
				user.items = user.items?.filter(
					(item: any) => item.status !== "gone"
				);
				await user.save();
				return user;
			} else {
				return;
			}
		} else {
			return;
		}
	}
);

export default model("User", UserSchema);
