const {pool} = require("../config/db");

const addVenderDetails = async (req,res) => {
    try{
        console.log(req.body)
        const {email,storeName,storeDescription} = req.body;

        if(!storeName){
            console.log(`Store name is required`);
            return res.status(400).json({message: `Store name is required`});
        }

        if(!storeDescription){
            console.log(`Store Description is required`);
            return res.status(400).json({message: `Store Description is required`});
        }

        const user = await pool.query(`SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if(user.rows.length === 0){
            console.log(`User is not registered on saliz.\nFirst register yourself`);
            return res.status(400).json({message: `User is not registered on saliz.\nFirst register yourself`});
        }

        const addVendor = await pool.query(`INSERT INTO vendors (user_id,store_name,store_description) VALUES ($1,$2,$3) RETURNING *`,
            [user.rows[0].id,storeName,storeDescription]
        );

        if(addVendor.rows.length === 0){
            console.log(`Error adding vendor details`);
            return res.status(500).json({message: `Error adding vendor details`});
        }

        return res.status(201).json({message: `Vendor details added.`,  vendor_id : addVendor.rows[0].id})
    }
    catch(error){
        console.log(`Error adding Vendor details.`)
        return res.status(500).json({message: `Error adding Vendor details.`})
    }
}

const addVendorBankDetails = async (req,res) => {
    const {id,bankName,accountHolderName,accountNo,swiftCode} = req.body;

    if(!bankName){
            console.log(`Bank Name is required`);
            return res.status(400).json({message: `Bank Name is required`});
    }

    if(!accountHolderName){
            console.log(`Accout Holder Name is required`);
            return res.status(400).json({message: `Accout Holder Name is required`});
    }

    if(!accountNo){
            console.log(`Account Number is required`);
            return res.status(400).json({message: `Account Number is required`});
    }

    if(!swiftCode){
            console.log(`Swift Code is required`);
            return res.status(400).json({message: `Swift Code is required`});
    }

    const user = await pool.query(`SELECT id FROM vendors WHERE id = $1`,
            [id]
    );

    if(user.rows.length === 0){
        console.log(`User is not registered on saliz.\nFirst register yourself`);
        return res.status(400).json({message: `User is not registered on saliz.\nFirst register yourself`});
    }

    const addVendorBankDetails = await pool.query(`INSERT INTO vendor_bank_details (vendor_id,bank_name,account_holder_name,account_number,swift_code) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [user.rows[0].id,bankName,accountHolderName,accountNo,swiftCode]
        );

    if(addVendorBankDetails.rows.length === 0){
        console.log(`Error adding vendor bank details`);
        return res.status(500).json({message: `Error adding vendor bank details`});
    }

    return res.status(201).json({message: `Vendor bank details added.`})
}

module.exports = {addVenderDetails,addVendorBankDetails}