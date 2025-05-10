import mongoose, { connect } from "mongoose";

const connectDb = async()=>{
    mongoose.connection.on("connected", ()=>{
        console.log("Mongodb is Connected")
    })
    await mongoose.connect(`${process.env.MONGODB_URL}/CollegeManagemetSystem`)
}

export default connectDb;