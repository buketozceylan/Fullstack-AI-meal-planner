import User from '../models/User.js';
import UserPreference from '../models/UserPreference.js';
import jwt from 'jsonwebtoken';

//generate token

const generateToken = (user) => {
    return jwt.sign(
        {id:user.id,email:user.email},
        process.env.JWT_SECRET,{expiresIn: '30d'}
    );
};
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // create user
    const user = await User.create({ email, password, name });

    // create default preferences
    await UserPreference.upsert(user.id, {
      dietary_restrictions: [],
      allergies: [],
      preferred_cuisines: [],
      default_servings: 4,
      measurement_unit: 'metric'
    });

    //generate token
    const token = generateToken(user);

    res.status(201).json({
        success: true,
        message: 'User registered succesfully',
        data:{
            user: {
                id: user.id,
                email: user.email,
                name: user.name
                },
                token
                }
});
    
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
    try{
        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
            
        }

        res.json({
            success: true,
            data: { user }
        });

    }catch (error){
        next(error);
    }
};

//request password reset

export const requestPasswordReset = async (req,res,next) => {
    try{
        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
            
        }

        const user = await User.findByEmail(email);

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });
    } catch(error){
        next(error);
    }
};

