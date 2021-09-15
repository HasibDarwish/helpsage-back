import passport from "passport";
import {Strategy} from "passport-github2";
import UserModel from "../../../services/user/userSchema";
import {generatePairOfJwtToken} from "../../tools/jwt";

passport.use(
	"github",
	new Strategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			callbackURL: process.env.GITHUB_REDIRECT_URL!,
		},
		async function (
			accessToken: string,
			refreshToken: string,
			profile: any,
			done: any
		) {
			try {
				const user = await UserModel.findOne({
					email: profile.emails[0].value,
				});
				if (user) {
					const tokens = await generatePairOfJwtToken(user);
					process.nextTick(() => done(null, {user, tokens}));
				} else {
					const newUser = {
						profile: {
							firstName: profile.name.givenName,
							username: profile.name.familyName,
							email: profile.emails[0].value,
						},
					};
					const createdUser = new UserModel(newUser);
					const savedUser = await createdUser.save();
					const tokens = await generatePairOfJwtToken(savedUser);
					process.nextTick(() => done(null, {user: savedUser, tokens}));
				}
			} catch (error: any) {
				process.nextTick(error);
			}
		}
	)
);

passport.serializeUser(function (user, done) {
	done(null, user);
});

export default passport;
