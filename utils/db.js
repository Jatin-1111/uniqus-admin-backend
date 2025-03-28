import mongoose from 'mongoose';
const URI = process.env.MONGODB_URI;

const connectDb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("Connection to DB Successful");
    } catch (error) {
        console.error("Connection to DB failed", error);
        process.exit(0);
    }
}

export default connectDb;