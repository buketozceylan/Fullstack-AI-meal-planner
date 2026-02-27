import User from "../models/User.js";
import UserPreference from "../models/UserPreference.js";

// get user profile
export const getProfile = async (req, res, next) => { // 'resizeBy' yerine 'res'
    try {
        const user = await User.findById(req.user.id);
        const preferences = await UserPreference.findByUserId(req.user.id);

        res.json({ // 'req.json' değil 'res.json'
            success: true,
            data: {
                user,
                preferences
            }
        });
    } catch (error) {
        next(error);
    }
};

// update profile
export const updateProfile = async (req, res, next) => {
    try {
        // req.body bir Promise değildir, await kullanma
        const { name, email } = req.body; 

        const user = await User.update(req.user.id, { name, email });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// update preferences
export const updatePreference = async (req, res, next) => {
    try {
        const preferences = await UserPreference.update(req.user.id, req.body);

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: { preferences }
        });
    } catch (error) {
        next(error);
    }
};

// change password
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findByEmail(req.user.email);
        const isValid = await User.verifyPassword(currentPassword, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        await User.updatePassword(req.user.id, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// delete account
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await User.findByIdAndDelete(userId); 
        
        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};