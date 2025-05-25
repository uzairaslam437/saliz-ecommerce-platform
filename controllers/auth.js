const {pool} = require("../config/db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const validator = require('validator');

const signUp = async (req,res) => {
    try{
        console.log(req.body);
        const {email,firstName ,lastName ,phone,dob,gender,password} = req.body;

        const emailCheckQuery = {
          text: `SELECT email FROM users WHERE email = $1`,
          values: [email]
        };

        const userExists = await pool.query(emailCheckQuery);

        if(userExists.rows[0].length !== 0){
          console.log(`Email already registered.`);
          return res.status(400).json({message: `Email already registered.`});
        }

        if(!validator.isEmail(email)){
            return res.status(400).json({message: `Email format is incorrect`});
        }

        const today = new Date();

        const birthDateObj = new Date(dob);

        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }

        if(age < 6){
            return res.status(400).json({message: `User must be older than 6 years`});
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const query = {
            text: `INSERT INTO users (email, first_name, last_name, phone, date_of_birth, gender, hash_password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            values: [email, firstName, lastName, phone, dob, gender, hashedPassword]
        };

        const addUser = await pool.query(query);
        const userRecord = addUser.rows[0];

        if(addUser.rows.length === 0){
            console.log(`Unable to insert record in database.`)
            return res.status(500).json({message: `inserting record in database failed`});
        }
        console.log(`User Registered.`)

        await sendEmail(userRecord.id,userRecord.email,userRecord.first_name);

        return res.status(201).json({message: `User registered successfully.
            Email sent at ${email} to verify your email.`})

    }
    catch(error){
        console.log(`Error: ${error}`)
        return res.status(500).json({message: `user registration failed.`,error: error.message})
    }
}

const sendEmail = async (id,recipientEmail,recipientName) => {
     const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_CLIENT_REFRESH_TOKEN });

     try {
    const accessToken = await oAuth2Client.getAccessToken();

    const verifyEmailRedirectURI = `http://localhost:5000/auth/verify-email/${id}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'mruzairaslam1@gmail.com',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.OAUTH_CLIENT_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: 'Saliz <mruzairaslam1@gmail.com>',
      to: recipientEmail,
      subject: 'Verify your email address',
      text: "pwnnr",
      html: `<h1>Hello ${recipientName}</h1>
      <p>Click on the button below to verify your email address:</p>
      <a href=${verifyEmailRedirectURI}> Verify Email </a>`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

const verifyEmail = async (req,res) => {
  try{
      const Id = req.params.Id;

      const query = {
        text:  `UPDATE users SET email_verified = TRUE WHERE id = $1 RETURNING *`,
        values: [Id]
      };

      const verifyEmail = await pool.query(query);

      if(verifyEmail.rows.length === 0){
        return res.status(400).json({message: `User doesn't exist with Id: ${Id}`});
      }
      console.log("Email Verified.")
      return res.status(400).json({message: `Email Verified.`});
    }
    catch(error){
      return res.status(500).json({message: `Email verification Failed.`, error: error.message});
    }
  }

  const signIn = async (req,res) => {
    try{
      const {email,password} = req.body;

      console.log(email)
      const query = {
        text: `SELECT * FROM users WHERE email = $1`,
        values: [email]
      }

      const queryRes = await pool.query(query);

      if(queryRes.rows.length === 0){
        console.log(`Invalid Email Address`)
        return res.status(400).json({message: `Invalid Email Address`})
      }

      const user = queryRes.rows[0];

      const match = await bcrypt.compare(password,user.hash_password)

      if(!match){
        console.log( `Incorrect Password`);
        return res.status(400).json({message: `Incorrect Password`});
      }


      const tokens = generateTokens(user)

      if(!tokens){
        console.log(`Error generating tokens`);
        return res.status(500).json({message: `Error generating token`});
      }
      
      return res.status(200).json({message: `User logged in Successfully`, ...tokens});
  }
  catch(error){
      console.log(`User sign in Failed.`)
      return res.status(500).json({message: `User sign in Failed.`, error: error.message});
  }
  
}

const generateTokens = (user) =>{
  try{
    const accessToken = jwt.sign({id: user.id, role: user.role},process.env.JWT_ACCESS_SECRET,{
      expiresIn: process.env.JWT_ACCESS_EXPIRY
    });

    const refreshToken = jwt.sign({id:user.id , role: user.role},process.env.JWT_REFRESH_SECRET,{
      expiresIn: process.env.JWT_REFRESH_EXPIRY
    });

    return {accessToken,refreshToken}
  }
  catch(error){
    return console.log(`Error generating tokens`);
  }
}

module.exports = {signUp,signIn,verifyEmail}