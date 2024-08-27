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
async function authenticateUserFromApiKey(apiKey) {
    try {
        const [prefix, userId, email] = apiKey.split('$');
        if (prefix !== 'mern') return null;
        return await UserModel.findOne({ _id: userId, email });
    } catch (error) {
        res.status(500).send({ message: 'Lỗi xác thực người dùng', error: error.message });
    }   
}   
app.post('/posts', async (req, res) => {
    try {
       
        const { apiKey } = req.query;
        if (!apiKey) throw new Error('apiKey không được cung cấp');

        const user = await authenticateUserFromApiKey(apiKey);
        if (!user) throw new Error('Xác thực người dùng thất bại');

        
        const { userId, content } = req.body;
        if (!userId) throw new Error('userId là bắt buộc');
        if (!content) throw new Error('Nội dung bài viết là bắt buộc');
        const crrUser = await UserModel.findById(userId)
        if (!crrUser) throw new Error('Người dùng không tồn tại');

        
        const createdPost = await PostModel.create({
            postId: crypto.randomUUID(),
            userId: userId,
            content: content,
            createAt: new Date(),
            updateAt: new Date()
        });
        res.status(201).send({ 
            message: "Tạo bài viết thành công", data: createdPost
        });
    } catch (error) {
        res.status(500).send({ message: 'Lỗi hệ thống', error: error.message });
    }
});

//4

app.listen(8080,()=>{
    console.log("Server is running")
})