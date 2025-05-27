const {Pool }= require("pg");
require("dotenv").config();


const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD
    });

const initDb = async () => {
    let client;
    try{
    client = await pool.connect();

    await client.query(
        `CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            hash_password VARCHAR(255),
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            phone VARCHAR(15),
            date_of_birth DATE,
            gender VARCHAR(10),
            is_active BOOLEAN DEFAULT TRUE,
            role VARCHAR(20) DEFAULT 'customer',
            email_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        );`
    );

    await client.query(`
        CREATE TABLE IF NOT EXISTS user_addresses(
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            full_name VARCHAR(255),
            address_line_1 VARCHAR(255) NOT NULL,
            address_line_2 VARCHAR(255),
            city VARCHAR(20),
            state VARCHAR(20),
            postal_code VARCHAR(10),
            country VARCHAR(20),
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    

    await client.query(
        `CREATE TABLE IF NOT EXISTS vendors(
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            store_name VARCHAR(20),
            store_description VARCHAR(255),
            store_logo VARCHAR(255),
            store_banner VARCHAR(255),
            commission_rate DECIMAL(5,2) DEFAULT 5.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        );`
    );

    await client.query(
        `CREATE TABLE IF NOT EXISTS vendor_bank_details (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
            bank_name VARCHAR(255) NOT NULL,
            account_holder_name VARCHAR(255) NOT NULL,
            account_number VARCHAR(50) NOT NULL,
            swift_code VARCHAR(20),
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`
    );

    await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            image VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            short_description VARCHAR(500),
            sku VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            compare_price DECIMAL(10,2), -- Original price for discount display
            cost_price DECIMAL(10,2), -- For vendor's reference
            track_inventory BOOLEAN DEFAULT TRUE,
            inventory_quantity INTEGER DEFAULT 0,
            low_stock_threshold INTEGER DEFAULT 5,
            weight DECIMAL(8,2),
            dimensions_length DECIMAL(8,2),
            dimensions_width DECIMAL(8,2),
            dimensions_height DECIMAL(8,2),
            requires_shipping BOOLEAN DEFAULT TRUE,
            is_digital BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'active',
            featured BOOLEAN DEFAULT FALSE,
            seo_title VARCHAR(255),
            seo_description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vendor_id, sku)
        );
        `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT unique_active_token UNIQUE(user_id,used_at)
            DEFERRABLE INITIALLY DEFERRED
        );`);

    await client.query(`
            CREATE INDEX IF NOT EXISTS idx_vendor_store_name ON vendors(store_name);
        `);


    console.log(`Database is successfully connected.`);
    }
    catch(error){
        console.log(`Error initializing database.`,error.message);
    }  
    finally{
        if(client){
            client.release();
        }
    }  
}

module.exports = {initDb,pool};