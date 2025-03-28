import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const adjudicatorSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        }
    }
)

//comparing the password
adjudicatorSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (error) {
        throw new Error(error);
    }
};

// JSON Web Token
adjudicatorSchema.methods.generateToken = async function () {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET_KEY is not defined in environment variables');
        }

        const token = jwt.sign(
            {
                id: this._id.toString(),
                adjudicatorId: this._id.toString(),
                email: this.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30d",
            }
        );

        if (!token) {
            throw new Error('Failed to generate token');
        }

        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
};

const Adjudicator = model('Adjudicator', adjudicatorSchema);

export default Adjudicator;