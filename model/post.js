import mongoose from 'mongoose'
const postSchema = new mongoose.Schema({
    userId: String,
    content: String,
    createdAt: Date,
    updatedAt: Date
})
const PostModel = mongoose.model('posts',postSchema)
export default PostModel