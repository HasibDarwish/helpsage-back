import jwt, {JwtPayload} from "jsonwebtoken";
import UserModel from "../../services/user/userSchema";

const generateJwtToken = async(payload: {}, tokenType: string) =>
	new Promise<string>((resolve, reject) =>
		jwt.sign(
			payload,
			process.env.JWT_SECRET!,
			{
				algorithm: "HS512",
				expiresIn: tokenType === "accessToken" ? "15 min" : "7 days",
			},
			(error, token) => {
				if (error) reject(error);
				else resolve(token!);
			}
		)
	);

export const generatePairOfJwtToken = async (user: any) => {
	const accessToken = await generateJwtToken({_id: user._id}, "accessToken");
	const refreshToken = await generateJwtToken({_id: user._id}, "refreshToken");
	user.refreshToken = refreshToken;
	await user.save();
	return {accessToken, refreshToken};
};

export const verifyJwtToken = (token: string) =>
	new Promise<JwtPayload>((resolve, reject) =>
		jwt.verify(token, process.env.JWT_SECRET!, (error, decodedToekn) => {
			if (error) reject(error);
			else resolve(decodedToekn!);
		})
	);
