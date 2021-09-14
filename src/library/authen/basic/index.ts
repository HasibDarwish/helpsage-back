import atob from "atob";
import createError from "http-errors";

import {RequestType} from "../../types";
import UserModel from "../../../services/user/userSchema";

const basicAuthentication: RequestType = async (req, res, next) => {
	if (req.headers.authorization) {
		const decodeHeader = atob(req.headers.authorization.split(" ")[1]);
		const [email, password] = decodeHeader.split(":");
		const user = await UserModel.checkCredentials(email, password);
		if (user) {
			req.user = user;
			next();
		} else {
			next(createError(401, {Message: "Wrong Credentials"}));
		}
	} else {
		next(
			createError(401, {
				Message: "Authorization Required",
				Solution: "Provide Credentials",
			})
		);
	}
};

export default basicAuthentication;
