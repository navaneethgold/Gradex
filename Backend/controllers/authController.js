import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import user from '../models/user.js';
import dotenv from 'dotenv';
dotenv.config();

export const signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const new_user = new user({ username, email, password: hashedPassword });
        await new_user.save();
        res.status(201).json({ message: "User created" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userExist = await user.findOne({ username: username });
        if (!userExist) return res.status(400).json({ message: "Invalid Username" });

        const userMatch = await bcrypt.compare(password, userExist.password);
        if (!userMatch) return res.status(400).json({ message: "Invalid Password" });

        const token = jwt.sign(
            {
                userId: userExist._id,
                email: userExist.email,
                username: userExist.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.status(200).json({ token, message: "Login successful" });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkLogin = (req, res) => {
    console.log(req.user);
    res.status(200).json({
        isLoggedIn: true,
        user: req.user,
        message: "Token is valid"
    });
};
