import mongoose from 'mongoose'
const postSchema = new mongoose.Schema({
    userId: String,
    content: String,
    createdAt: {
        type: Date,
        default: Date.now // Tự động gán thời gian hiện tại khi tạo bài post
      },
    updatedAt:{
        type: Date,
        dafault: Date.now
    }
})
const PostModel = mongoose.model('posts',postSchema)
export default PostModel