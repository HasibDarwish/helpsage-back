import mongoose from "mongoose";

const { Schema, model } = mongoose;

const MessageSchema = new Schema({
	user: { type: mongoose.Types.ObjectId, ref: "User" },
	text: { type: String },
	image:[{type:String}]
},{timestamps:true})

const ChatSchema = new Schema({
	participants: [{type: mongoose.Types.ObjectId, ref: "User"}],
	item: {type: mongoose.Types.ObjectId, ref: "Item"},
	history: [MessageSchema],
});


ChatSchema.methods.toJSON = function () {
	const chat = this;
	const chatObject = chat.toObject();

	delete chatObject.__v;

	return chatObject;
};
export default model("Chat", ChatSchema)
