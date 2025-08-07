const {pool} = require("../model/db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { google} = require('googleapis');
const validator = require('validator');
const crypto = require("crypto");

const signUp = async (req,res) => {
    try{
        console.log(req.body);
        const {email,firstName ,lastName ,phone,password,role} = req.body;

        const emailCheckQuery = {
          text: `SELECT email FROM users WHERE email = $1`,
          values: [email]
        };

        const userExists = await pool.query(emailCheckQuery);

        if(userExists.rows.length > 0){
          console.log(`Email already registered.`);
          return res.status(400).json({message: `Email already registered.`});
        }

        if(!validator.isEmail(email)){
            return res.status(400).json({message: `Email format is incorrect`});
        }

        const username = email.split("@")[0];

        const hashedPassword = await bcrypt.hash(password,10);

        const query = {
            text: `INSERT INTO users (email, first_name, last_name, phone, hash_password,username,role) VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING *`,
            values: [email, firstName, lastName, phone, hashedPassword,username,role]
        };

        const addUser = await pool.query(query);
        const userRecord = addUser.rows[0];

        if(addUser.rows.length === 0){
            console.log(`Unable to insert record in database.`)
            return res.status(500).json({message: `inserting record in database failed`});
        }
        console.log(`User Registered.`)

      //   const verificationToken = crypto.randomBytes(32).toString('hex');
      //   const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      //   // console.log("User Record: user's id",userRecord.id)
      //   await pool.query(
      //     `INSERT INTO email_verification_tokens (user_id,token,expires_at) VALUES
      //     ($1,$2,$3)`,[userRecord.id,verificationToken,expiresAt]
      // );


      //   await sendEmail(verificationToken,userRecord.email,userRecord.first_name);

        return res.status(201).json({message: `User registered successfully.`})

    }
    catch(error){
        console.log(`Error: ${error}`)
        return res.status(500).json({message: `user registration failed.`,error: error.message})
    }
}

const sendEmail = async (verificationToken,recipientEmail,recipientName) => {
     const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_CLIENT_REFRESH_TOKEN });

     try {
    const accessToken = await oAuth2Client.getAccessToken();

    const verifyEmailRedirectURI = `http://localhost:5000/auth/verify-email?token=${verificationToken}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.SENDER_EMAIL,
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
      const token = req.query.token;

      if(!token){
        return res.status(400).json({message: `Token is required.`})
      }

      const tokenQuery = await pool.query(
        `SELECT vt.*,u.email,u.first_name
        FROM email_verification_tokens vt
        JOIN users u ON vt.user_id = u.id 
        WHERE vt.token = $1
        AND vt.used_at IS NULL
        AND vt.expires_at > NOW()`,
        [token]
      )

      if(tokenQuery.rows.length === 0){
        return res.status(400).json({
          message: `Invalid or expired token`
        });
      }

      const verification = tokenQuery.rows[0];

      const client = await pool.connect();

      try{
        await client.query(`BEGIN;`);

        await client.query(`
          UPDATE users SET email_verified = TRUE , updated_at = NOW() WHERE id = $1`,
        [verification.user_id]);

        await client.query(`
          UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1`,
        [token]);

        await client.query(`COMMIT`);

        console.log("Email Verified.")
        return res.status(200).json({message: `Email Verified. You can now log in.`});
      }
      catch(error){
        await client.query('ROLLBACK');
        throw error;
      }
      finally{
        await client.release()
      }  
    }
    catch(error){
      return res.status(500).json({message: `Email verification Failed.`, error: error.message});
    }
  }

  const signIn = async (req,res) => {
    try{
      const {email,password} = req.body;

      const query = {
        text: `SELECT * FROM users WHERE email = $1`,
        values: [email]
      }

      const queryRes = await pool.query(query);

      if(queryRes.rows.length === 0){
        console.log(`Email not registered`)
        return res.status(400).json({message: `Email not registered`})
      }

      const user = queryRes.rows[0];

      const match = await bcrypt.compare(password,user.hash_password)

      if(!match){
        console.log( `Incorrect Password`);
        return res.status(400).json({message: `Incorrect Password`});
      }


      const tokens = generateTokens(user)

      const {accessToken,refreshToken} = tokens;

      // if(!tokens){
      //   console.log(`Error generating tokens`);
      //   return res.status(500).json({message: `Error generating token`});
      // }

      // if(user.role === "vendor"){
      //   return res.status(200).json({message: `User logged in Successfully`, ...tokens,vendorId: user.id});

      // }

      await pool.query(`INSERT INTO refresh_tokens (user_id,token) VALUES ($1,$2)`,
        [user.id,refreshToken]
      );

    
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production (HTTPS)
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return res.status(200).json({message: `User logged in Successfully`, token: accessToken});
  }
  catch(error){
      console.log(`User sign in Failed. ${error}`)
      return res.status(500).json({message: `User sign in Failed.`, error: error.message});
  }
  
}

const   generateTokens = (user) =>{
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

const resendVerificationMail = async (req,res) => {
  try{
    const {email} = req.body;

    const verified = await pool.query(`
      SELECT id , first_name , email_verified FROM users WHERE email = $1`,
    [email]);

    if(verified.rows.length === 0){
      console.log(`Email is not registered.`);
      return res.status(400).json({message: `Email is not registered.`})
    }

    if(verified.rows[0].email_verified === "TRUE"){
      console.log(`Email is already verified.`);
      return res.status(404).json({message: `Email is already verified.`});
    }

    const result = await pool.query(`
      SELECT token FROM email_verification_tokens 
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `);

    if(result.rows.length > 0){
      console.log(`Please wait 5 minutes before requesting email verification`);
      return res.status(400).json({message: `Please wait 5 minutes before requesting email verification`});
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(`INSERT INTO email_verification_tokens (user_id,token,expires_at) VALUES ($1,$2,$3)`,
      [verified.rows[0].id,token,expiresAt]
    );

    await sendEmail(token,email,verified.rows[0].first_name);

    console.log(`Verification email sent to user.`);
    return res.status(200).json({message: `Verification email sent to user.`});
  }
  catch(error){
    console.log(`resend verification email error: ${error}`)
    return res.status(500).json(500).json({message:`resend verification email error.` ,error:error})
  } 
}


const refreshAcessToken = async (req, res) => {
  console.log(`Refresh Token requested`);
  console.log("Cookies Received:", req.cookies);

  try {
    const refreshToken = req.cookies.refresh_token;
    console.log("Refresh Token:", refreshToken);

    // 1. Verify Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("Decoded Refresh Token:", decoded);

    // 2. Check if token exists in DB (optional but good practice)
    const query = {
      text: `SELECT * FROM refresh_tokens WHERE token = $1`,
      values: [refreshToken]
    };
    const valid = await pool.query(query);

    if (valid.rows.length === 0) {
      return res.status(401).json({ message: `Refresh token not found in DB` });
    }

    // 3. Create new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );

    console.log("New Access Token:", newAccessToken);

    return res.status(200).json({ token: newAccessToken });

  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};


module.exports = {signUp,signIn,verifyEmail,resendVerificationMail,refreshAcessToken}