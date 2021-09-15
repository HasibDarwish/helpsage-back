import express, {Response, NextFunction } from "express"
import passport from "../../library/authen/googleAuth";
import {cookieOption} from "../types"

const GoogleRouter =  express.Router()

GoogleRouter.get(
	"/googlelogin",
	passport.authenticate("google", {scope: ["profile", "email"]})
);

GoogleRouter.get(
	"/googleRedirect",
	passport.authenticate("google"),
	async (req: any, res: Response, next: NextFunction) => {
		try {
			res.cookie("accessToken", req.user.tokens.accessToken, cookieOption);
			res.cookie("refreshToken", req.user.tokens.refreshToken, cookieOption);
			res
				.status(200)
				.redirect(
					`${
						process.env.REDIRECT_TO_FRONT! ||
						"https://helpsage-frontend.vercel.app/login"
					}`
				);
		} catch (error) {
			next(error);
		}
	}
);

export default GoogleRouter;