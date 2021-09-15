import passport from "passport";
import {Strategy} from "passport-google-oauth20";
import UserModel from "../../../services/user/userSchema";
import {generatePairOfJwtToken} from "../../tools/jwt";

passport.use(
	"google",
	new Strategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL:
				process.env.GOOGLE_REDIRECT_URL ||
				"https://helpsage.herokuapp.com/googleRedirect",
		},
		async (
			accessToken: any,
			refreshToken: any,
			profile: any,
			passportNext: any
		) => {
			try {
				const user = await UserModel.findOne({
					email: profile.emails[0].value,
				});
				if (user) {
					const tokens = await generatePairOfJwtToken(user);
					passportNext(null, {user, tokens});
				} else {
					const newUser = {
						firstName: profile.name.givenName,
						username: profile.name.familyName,
						email: profile.emails[0].value,
					};
					const createdUser = new UserModel(newUser);
					const savedUser = await createdUser.save();
					const tokens = await generatePairOfJwtToken(savedUser);
					passportNext(null, {user: savedUser, tokens});
				}
			} catch (error: any) {
				passportNext(error);
			}
		}
	)
);

passport.serializeUser(function (user: any, passportNext: any) {
	passportNext(null, user);
});

export default passport;
