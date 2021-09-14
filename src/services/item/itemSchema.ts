import mongoose from "mongoose";

const { Schema, model } = mongoose;


const ItemSchema = new Schema({
	description: {type: String, required: true},
	images: [{type:String}],
	user: {type: mongoose.Types.ObjectId, ref: "User"},
	status: {type: String, enum: ["available", "gone"], default: "available"},
}, {timestamps: true });

ItemSchema.methods.toJSON = function () {
	const item = this;
	const itemObject = item.toObject();

	delete itemObject.__v;

	return itemObject;
};

export default model("Item", ItemSchema);
