import User from "../models/User";
import {UserInputError} from "apollo-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Color from "../models/Color";
import Design from "../models/Design";
import Post from "../models/Post";
import {ACCESS_TOKEN_SECRET} from "../constants";
import mongoose from 'mongoose';
import {isAuth} from "../utils";

const defaultNewUser = {
    username: "",
    givenName: "",
    familyName: "",
    email: "",
    password: "",
    confirmPassword: ""
}

const defaultUser = {
    email: "",
    password: "",
}

const colorData = {
    userId: "",
    name: "",
    value: ""
}

const defaultDesignData = {
    userId: "",
    name: "",
    colors: []
}

const defaultPostData = {
    id: "",
    message: "",
    selectedFile: ""
}

const defaultCommentData = {
    id: "",
    comment: ""
}

export const Mutation = {
    signUp: async (_: any, args = defaultNewUser) => {
        const {username, givenName, familyName, email, password, confirmPassword} = args

        const emailRegistered = await User.findOne({email});
        const takenUsername = await User.findOne({username});

        if (emailRegistered || takenUsername) {
            throw new UserInputError(emailRegistered ? 'Email is already registered' : 'Username is taken');
        }
        if (password !== confirmPassword) {
            throw new UserInputError('Passwords do not match');
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({username, givenName, familyName, password: hashedPassword, email});

        const token = jwt.sign({email: user.email, id: user._id},
            ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

        return {
            user,
            token
        };
    },

    signIn: async (_: any, args = defaultUser) => {
        const {email, password} = args

        const existingUser = await User.findOne({email});
        if (!existingUser) {
            throw new UserInputError('User not found', {
                errors: {
                    email: "Email does not exist"
                }
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            throw new UserInputError('Invalid credentials', {
                errors: {
                    email,
                    password
                }
            });
        }

        const token = jwt.sign({email: existingUser.email, id: existingUser._id},
            ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

        return {
            user: existingUser,
            token
        }
    },
    uploadColor: async (_: any, args = colorData, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId});
        const {name, value} = args

        const color = new Color({name, value, user: userId, createdAt: new Date().toISOString()})
        await color.save();

        return {
            color,
            user
        };
    },
    deleteColor: async (_: any, args = {id: ""}, context: any) => {
        const {id} = args
        isAuth(context)
        await Color.findByIdAndDelete(id)
        return true
    },
    uploadDesign: async (_: any, args = defaultDesignData, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId});
        const {name, colors} = args

        const design = new Design({name, colors, user: userId, createdAt: new Date().toISOString()})
        await design.save();

        return {
            design,
            user
        };
    },
    uploadPost: async (_: any, args = defaultPostData, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId});
        const {message, selectedFile} = args

        const post = new Post({message, selectedFile, user: userId, createdAt: new Date().toISOString()})
        await post.save();
        return {
            post,
            user
        };
    },
    updatePost: async (_: any, args = defaultPostData, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId});
        const {id, message, selectedFile} = args

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`No post with id: ${id}`);
        }
        const updatedPost = {_id: id, message, selectedFile, user: userId};
        const post = await Post.findByIdAndUpdate(id, updatedPost, {new: true});

        return {
            post,
            user
        }
    },
    deletePost: async (_: any, args = {id: ""}, context: any) => {
        isAuth(context)
        const {id} = args
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`No post with id: ${id}`);
        }
        await Post.findByIdAndDelete(id)
        return true
    },
    likePost: async (_: any, args = {id: ""}, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId});
        const {id} = args;
        const post = await Post.findById(id);
        if (!post) {
            throw new Error(`No post with the id: ${id}`)
        }
        const index = post.likes.findIndex((id: string) => id === String(userId));

        if (index === -1) {
            post.likes.push(userId);
        } else {
            post.likes = post.likes.filter((id: string) => id !== String(userId));
        }

        const updatedPost = await Post.findByIdAndUpdate(id, post, {new: true});

        return {
            post: updatedPost,
            user
        };
    },
    commentPost: async (_: any, args = defaultCommentData, context: any) => {
        const userId = isAuth(context)
        const user = await User.findOne({"_id": userId})

        const {id, comment} = args
        const post = await Post.findById(id)

        if (!mongoose.Types.ObjectId.isValid(id) || !post) {
            throw new Error(`No post with id: ${id}`);
        }

        post.comments.push({"username": user.username, "text": comment});

        return Post.findByIdAndUpdate(id, post, {new: true});
    }
}

