const {pool} = require("../model/db");

const addToCart = async (req,res) => {
    try{
        const userId = req.user.id;
        const {productId,quantity,price} = req.body;
        const query =  {
            text: `INSERT INTO cart (user_id,product_id,quantity,price) VALUES ($1,$2,$3,$4) RETURNING *`,
            values : [userId,productId,quantity,price]
        }

        const cart = await pool.query(query);

        return res.status(201).json({message: `Product is added to cart`});
    }
    catch(error){
        console.log(error)
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const getCart = async (req,res) => {
    try{
        const userId = req.user.id;

        const query = {
            text: `SELECT * FROM cart WHERE user_id = $1`,
            values: [userId]
        }

        const cart = await pool.query(query);


        return res.status(200).json({message: `Cart is retreived.`,cartItems: cart.rows[0]});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: `Internal Server Erro`})
    }
}

const updateCartAdd = async (req,res) => {
    try{
        const userId = req.user.id;
        const productId = req.params.productId;
        const {quantity,price} = req.body;

        const query =  {
            text: `INSERT INTO cart (user_id, product_id, quantity, price)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id, product_id)
                    DO UPDATE SET quantity = cart.quantity + $3, price = cart.price + $4`,
            values : [userId,productId,quantity,price]
        }

        const cart = await pool.query(query);

        return res.status(201).json({message: `Product is added to cart`});
    }
    catch(error){
        console.log(error)
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const updateCartRemove = async (req,res) => {
    try{
        const userId = req.user.id;
        const productId = req.params.productId;


        const query =  {
            text: `DELETE FROM cart WHERE user_id = $1 AND product_id = $2`,
            values : [userId,productId]
        }

        const cart = await pool.query(query);

        return res.status(200).json({message: `Product is deleted from cart`});
    }
    catch(error){
        console.log(error)
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const deleteCart = async (req,res) => {
    try{
        const userId = req.user.id;

        const query =  {
            text: `DELETE FROM cart WHERE user_id = $1`,
            values : [userId]
        }

        const cart = await pool.query(query);

        return res.status(200).json({message: `Cart is deleted`});
    }
    catch(error){
        console.log(error)
        return res.status(500).json({message: `Internal Server Error`});
    }
}


module.exports =  {addToCart,updateCartAdd,updateCartRemove,deleteCart,getCart};





