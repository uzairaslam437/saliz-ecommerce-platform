const { pool } = require("../model/db");

const addProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      name,
      description,
      shortDescription,
      sku,
      price,
      comparePrice,
      inventoryQuantity,
      weight,
      requiresShipping,
      status,
      featured,
    } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      console.log("files lenght:", files?.length || "files is undefined");
      return res
        .status(400)
        .json({ message: "upload atleast one picture of product." });
    }

    const imageUrls = files.map((file) => file.location);
    if (
      !vendorId ||
      !name ||
      !description ||
      !price ||
      !sku ||
      !inventoryQuantity ||
      !weight ||
      !requiresShipping ||
      !status
    ) {
      console.log(`All fields are required`);
      return res.status(400).json({ message: `All fields are required` });
    }

    const productRecord = await pool.query(
      `INSERT INTO products (vendor_id,name,description,short_description,sku,price,compare_price,inventory_quantity,weight,requires_shipping,status,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        vendorId,
        name,
        description,
        shortDescription,
        sku,
        price,
        comparePrice,
        inventoryQuantity,
        weight,
        requiresShipping,
        status,
        featured,
      ]
    );

    if (productRecord.rows[0].length === 0) {
      console.log(`Product record not added`);
      return res.status(500).json(`Something went wrong. Please try again`);
    }

    const insertImagePromises = imageUrls.map((url, index) => {
      return pool.query(
        "INSERT INTO product_images (product_id , image_url , sort_order) VALUES ($1,$2,$3) RETURNING *",
        [productRecord.rows[0].id, url, index]
      );
    });

    await Promise.all(insertImagePromises);

    return res.status(201).json({ message: `Product Added Successfully.` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Internal Server Error` });
  }
};

const getStoreProducts = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    const query = {
      text: `SELECT DISTINCT ON (products.id)
                        products.name,
                        products.short_description,
                        products.price,
                        products.compare_price,
                        product_images.image_url
                    FROM products
                    JOIN product_images ON product_images.product_id = products.id
                    WHERE products.vendor_id = $1
                    ORDER BY products.id, product_images.id ASC`,
      values: [vendorId],
    };
    const products = await pool.query(query);

    if (products.rows.length === 0) {
      return res.status(200).json({ message: "No product listed at store" });
    }

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: products.rows,
    });
  } catch (error) {
    console.log(`Error:${error}`);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

const getProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const query = {
      text: `SELECT 
                products.name,
                products.description,
                products.short_description,
                products.price,
                products.compare_price,
                products.weight,
                products.sku,
                vendors.store_name,
                json_agg(product_images.image_url) AS image_urls
            FROM products
            JOIN product_images ON product_images.product_id = products.id
            JOIN vendors ON vendors.id = products.vendor_id
            WHERE products.id = $1
            GROUP BY 
                products.id,
                vendors.store_name
        `,
      values: [productId],
    };

    const productQuery = await pool.query(query);

    if (productQuery.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productQuery.rows[0];

    return res.status(200).json({
      message: "Product retrieved successfully",
      name: product.name,
      description: product.description,
      shortDescription: product.short_description,
      price: product.price,
      comparePrice: product.compare_price,
      weight: product.weight,
      sku: product.sku,
      images: product.image_urls,
      vendorStoreName: product.store_name,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(req.body);
    const productId = req.params.id;
    const {
      name,
      description,
      shortDescription,
      price,
      comparePrice,
      inventoryQuantity,
      weight,
      status,
    } = req.body;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (name) {
      whereConditions.push(` name = $${paramCount++} `);
      values.push(name);
    }

    if (description) {
      whereConditions.push(` description = $${paramCount++} `);
      values.push(description);
    }

    if (shortDescription) {
      whereConditions.push(` short_description = $${paramCount++} `);
      values.push(shortDescription);
    }

    if (price) {
      whereConditions.push(` price = $${paramCount++} `);
      values.push(price);
    }

    if (comparePrice) {
      whereConditions.push(` compare_price = $${paramCount++} `);
      values.push(comparePrice);
    }

    if (inventoryQuantity) {
      whereConditions.push(` inventory_quantity = $${paramCount++} `);
      values.push(inventoryQuantity);
    }

    if (weight) {
      whereConditions.push(` weight = $${paramCount++} `);
      values.push(weight);
    }

    if (status) {
      whereConditions.push(` status = $${paramCount++} `);
      values.push(status);
    }

    whereConditions.push(` updated_at =  CURRENT_TIMESTAMP`);
    values.push(productId);

    const query = {
      text: `UPDATE products SET ${whereConditions.join(" , ")} 
                WHERE id = $${paramCount}`,
      values: [...values],
    };

    const update = await pool.query(query);

    const updatedFields = update.rows[0];

    return res.status(200).json({ message: `Product updated successfully` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Internal Server Error` });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const query = `DELETE FROM products WHERE id = $1 RETURNING *`;

    const deleteQuery = await pool.query(query, [productId]);

    return res.status(200).json({ message: `Product deleted successfully` });
  } catch (error) {
    return res.status(500).json({ message: `Internal Server Error` });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const query = {
      text: `
        SELECT DISTINCT ON (products.id)
        products.id,
        products.name,
        products.price,
        product_images.image_url AS imageUrl
        FROM products
        JOIN product_images ON products.id = product_images.product_id
        ORDER BY products.id, product_images.id ASC;  
      `,
    };

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    const products = result.rows.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageurl, // alias used in SELECT
      rating: product.rating,
    }));

    return res.status(200).json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addProduct,
  getProduct,
  getStoreProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
};
