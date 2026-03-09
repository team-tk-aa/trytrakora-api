import mongoose from "mongoose";
require("dotenv").config();

const dbURL: string = process.env.MONGO_URI as string;

const connectDB = async () => {
    try {
        await mongoose.connect(dbURL).then((data: any) => {
            console.log(`Database connected with ${data.connection.host}`)
        })
    } catch (error: any) {
        console.log("error", error.message);
        setTimeout(connectDB, 5000);
    }
}

export default connectDB;