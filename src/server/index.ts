import express from "express";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import {createServer} from "http";
import {Server} from "socket.io";

import UserRouter from "../services/user";
import errorHandlers from "../library/errorHandlers";
import ItemRouter from "../services/item";
import ChatRouter from "../services/chat";
import UserModel from "../services/user/userSchema";
import {ChatTypes} from "src/services/types";
import ChatModel from "../services/chat/chatSchema";
import passport from "passport";
import GithubRouter from "../services/user/github";
import GoogleRouter from "../services/user/google";

dotenv.config();

const {PORT, MONGO_URL} = process.env;
const app = express();

app.use(cors({
	origin: [
		process.env.MONGO_URL!,
		process.env.GOOGLE_REDIRECT_URL!,
		process.env.GITHUB_REDIRECT_URL!,
		process.env.REDIRECT_TO_FRONT!,
		process.env.FRONT_END_CLOUD!,
	], credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/", GithubRouter);
app.use("/", GoogleRouter);
app.use("/", UserRouter);
app.use("/item", ItemRouter);
app.use("/chat", ChatRouter);
app.use("/", errorHandlers);

const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: [process.env.FRONT_END_CLOUD!],
		methods: ["GET", "POST", "DELETE", "PUT"],
		allowedHeaders: ["my-custom-header"],
		credentials: true,
	},
	allowEIO3: true,
});

io.on("connection", (socket) => {
	console.table({"User joined": socket.id});

	socket.on("createChat", (chatInfo) => {
		console.log(chatInfo);
	});
	socket.on("joinRoom", (roomId) => {
		console.log("User", roomId)
		socket.join(roomId);
	});

	socket.on("message", async (msgIn) => {
		try {
			const msg = await ChatModel.findByIdAndUpdate(
				msgIn.roomId,
				{
					$push: {history: msgIn.message},
				},
				{new: true}
			);
			io.to(msgIn.roomId).emit("message", {
				roomId: msgIn.roomId,
				message:msgIn.message
			});
		} catch (error) {
			console.log(error);
		}
	});
	socket.on("typing", (user) => {
		socket.broadcast.emit("typing", user)
	})

	socket.on("disconnect", () => console.table({"User left": socket.id}));
});

mongoose
	.connect(MONGO_URL!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})
	.then(() => server.listen(PORT!, () => console.table(listEndpoints(app))));
