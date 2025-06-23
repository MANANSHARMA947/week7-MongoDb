import express, { response } from "express";
import { UserModel, TodoModel } from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
const JWT_SECRET = "iammanan";
const app = express();
import { z } from "zod"; // for input validation

mongoose.connect(
  "mongodb+srv://admin:manan2006@cluster0.ejdczy9.mongodb.net/Todo-app-database"
);
app.use(express.json());

app.post("/signup", async function (req, res) {

  const requiredBody = z.object({
    email:z.string().min(3).max(100).email(),

    password:z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must include at least one special character"),

    name:z.string().min(3).max(100)
  })


// difference between pasre and safeparse is that parse will either return u data if everything is right or otherwise terminate the execution and safeparse return you sucess : either true || false and safely pareses it 
  const parsedDataWithSuccess = requiredBody.safeParse(req.body)
  if(!parsedDataWithSuccess.success){
    res.json({
      message:"incorrect format",
      error:parsedDataWithSuccess.error.format()
    })
    return
  }
  const { email, password, name } = parsedDataWithSuccess.data;
  const hashedPassword = await bcrypt.hash(password, 10); // bcrypt hashes the password for better security

  await UserModel.create({
    email: email,
    name: name,
    password: hashedPassword,
  });
  res.json({
    message: "you are logged in",
  });
});

app.post("/signin", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const response = await UserModel.findOne({
    email: email,
  });
  if (!response) {
    res.status(403).json({
      message: "user does not exist in our db",
    });
    return;
  }
  const passwordMatch = await bcrypt.compare(password, response.password);

  if (passwordMatch) {
    const token = jwt.sign(
      {
        id: response._id.toString(),
      },
      JWT_SECRET
    );
    res.json({
      token,
    });
  } else {
    res.status(403).json({
      message: "incorrect",
    });
  }
});

function auth(req, res, next) {
  const token = req.headers.token;
  const decodedData = jwt.verify(token, JWT_SECRET);

  if (decodedData) {
    // req = {status, headers...., username, password, userFirstName, random; ":123123"}
    req.userId = decodedData.id;
    next();
  } else {
    res.status(403).json({
      message: "incorrect",
    });
  }
}
app.post("/todo", auth, async function (req, res) {
  const title = req.body.title;
  await TodoModel.create({
    title: title,
    userId,
  });
  res.json({
    userId: userId,
  });
});
app.get("/todos", auth, async function (req, res) {
  const userId = req.id;
  // const findtodo = req.body.title;
  const todos = await TodoModel.find({
    userId: userId,
  });
  res.json({
    todos,
    userId,
  });
});

app.listen(3000);
