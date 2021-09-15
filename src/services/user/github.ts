import express, {CookieOptions, NextFunction, Response} from "express";
import passport from "../../library/authen/githubAuth";

const GithubRouter = express.Router();

GithubRouter.get(
	"/githublogin",
	passport.authenticate("github", {scope: ["user:email"]})
);

const cookieOptions: CookieOptions =
	process.env.NODE_ENV === "development"
		? {httpOnly: true}
		: {httpOnly: true, sameSite: "none", secure: true};

GithubRouter.get(
	"/githubredirect",
	passport.authenticate("github", {failureRedirect: "/login"}),

	async (req: any, res: Response, next: NextFunction) => {
		try {
			res.cookie("accessToken", req.user.tokens.accessToken, cookieOptions);
			res.cookie("refreshToken", req.user.tokens.refreshToken, cookieOptions);
			res.status(200).redirect(`${process.env.REDIRECT_TO_FRONT!}`);
		} catch (error) {
			next(error);
		}
	}
);

export default GithubRouter;
