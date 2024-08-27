import express from 'express'
import mongoose from 'mongoose'
import UserModel from './model/user.js'
import PostModel from './model/post.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config();
await mongoose.connect(process.env.MONGODB_URL);
const app = express();
app.use(express.json());
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
  
//1
app.post('/users/register', async (req,res)=>{
    try{
        const {userName,email,password} = req.body;
        if(!userName) throw new Error("Yêu cầu điền userName");
        if(!email) throw new Error("Yêu cầu điền email");
        if(!password) throw new Error("Yêu cầu điền mật khẩu");
        const existEmail = await UserModel.findOne({
            email:email
        })
        if(existEmail) throw new Error("Email đã tồn tại");
        const newPassword = bcrypt.hashSync(password, salt);
        const createdUser = await UserModel.create({
                password:newPassword,
                email,
                userName
        });
        res.status(201).send({
            message:'Đăng kí thành công!',
            data:createdUser
          });
    }catch(error){
        res.status(403).send({
            message: error.message,
            data:null
        })
    }
})

//2
app.post('/users/login',async (req,res)=>{
    try{
        const {email,password} = req.body;
        if (!password) throw new Error("Bạn chưa cung cấp mật khẩu");
        if (!email) throw new Error("Bạn chưa cung cấp email");
        const currentUser = await UserModel.findOne({email:email});
        if(!currentUser) throw new Error("Sai tài khoản");
        const comparedPassword = bcrypt.compareSync(password,currentUser.password)
        if(!comparedPassword) throw new Error("Sai mật khẩu")
        const randomString = crypto.randomUUID();
        const apiKey = `mern-$${currentUser._id}$-$${currentUser.email}$-$${randomString}$`;
        res.status(200).send({
            message:'Đăng nhập thành công!',
            data: apiKey
        });
    } catch(error){
        res.status(403).send({
            message: error.message,
            data:null
        })
    }
})

//3
app.post('/posts',async (req,res)=>{
    try{
        const { apiKey } = req.query;
        if (!apiKey) throw new Error("Chưa có API key");
        const { userId, content } = req.body;
        if (!userId) throw new Error("userId is required");
        if (!content) throw new Error("Bạn chưa tạo bài viết");
        const newPost = await PostModel.create({
            postId: crypto.randomUUID(),
            userId: userId,
            content: content,
            createAt: new Date(),
            updateAt: new Date(),
          });
      
        res.status(200).send({
            message: "Thanh cong",
            data: newPost,
        });
    } catch (error) {
        res.status(403).send({
            message: error.message,
            data:null
        })
    }
})

//4
app.put('/posts/:id',async (req,res)=>{
    const { id } = req.params;
  const { apiKey} = req.query;
    const {content} = req.body;
  // Kiểm tra xem tất cả các tham số cần thiết đã được cung cấp
  if (!apiKey) {
    return res.status(400).send({ message: 'API Key is required' });
  }
  if (!content) {
    return res.status(400).send({ message: 'Content is required' });
  }
  if (!id) {
    return res.status(400).send({ message: 'Post ID is required' });
  }

  try {
    const apiKeySchema = new mongoose.Schema({
        key: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      });
    const ApiKey = mongoose.model('ApiKey', apiKeySchema);
      
    const validApiKey = await ApiKey.findOne({ key: apiKey });

    if (!validApiKey) {
      return res.status(401).send({ message: 'Invalid API Key' });
    }

    // Tìm bài post theo ID
    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    // Cập nhật nội dung bài post
    post.content = content;
    post.updatedAt = Date.now(); // Cập nhật thời gian

    await post.save();
    res.status(200).send({ message: 'Post updated successfully', post });
  } catch (error) {
    res.status(500).send({ message: 'Post update failed', error });
  }
});
app.listen(8080,()=>{
    console.log("Server is running")
})