import LocalUser from "../models/LocalUser.js";
/**
 * Debug endpoints to inspect LocalUser documents.
 * Only allowed when NODE_ENV !== 'production'.
 */
export const getUserByEmailOrId = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'forbidden', message: 'Debug endpoints disabled in production' });
    }
    try {
        const { email, id } = req.query;
        let user = null;
        if (id) {
            user = await LocalUser.findById(String(id)).exec();
        }
        else if (email) {
            user = await LocalUser.findOne({ email: String(email) }).exec();
        }
        else {
            return res.status(400).json({ error: 'missing_params', message: 'Provide `email` or `id` query param' });
        }
        if (!user)
            return res.status(404).json({ error: 'not_found' });
        // Return raw document (including spotify fields) for debugging
        return res.json({ user });
    }
    catch (err) {
        console.error('debug.getUserByEmailOrId error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
};
export default { getUserByEmailOrId };
//# sourceMappingURL=debug.controller.js.map