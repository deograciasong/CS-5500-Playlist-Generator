import jwt from "jsonwebtoken";
import LocalUser from "../models/LocalUser.js";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";
export const getCurrentAuthUser = async (req, res) => {
    try {
        const token = req.cookies?.auth_token || (req.headers.authorization || "").split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "unauthenticated", message: "Not authenticated" });
        }
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        }
        catch (err) {
            return res.status(401).json({ error: "invalid_token", message: "Invalid token" });
        }
        const userId = payload?.sub;
        if (!userId) {
            return res.status(401).json({ error: "invalid_token", message: "Invalid token payload" });
        }
        const user = await LocalUser.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ error: "not_found", message: "User not found" });
        }
        return res.json({ user: { id: user._id, name: user.name, email: user.email, displayName: user.name } });
    }
    catch (err) {
        console.error('getCurrentAuthUser error', err);
        return res.status(500).json({ error: 'internal_error', message: 'Failed to fetch user' });
    }
};
export default { getCurrentAuthUser };
//# sourceMappingURL=auth-me.controller.js.map