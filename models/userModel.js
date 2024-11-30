import mongoose from "mongoose";

const userShema = new mongoose.Shema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true}
})

const user = mongoose.model('users', userShema)
export default user