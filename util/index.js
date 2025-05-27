const {pool} = require("../config/db");

const cleanupExpiredAndUsedTokens = async () => {
    try{
        const result = await pool.query(`DELETE FROM email_verification_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL`);

        console.log(`Cleaned up ${result.rowCount} expired/used tokens`);
    }
    catch(error){
        console.log(`Token cleanup error:${error}`)
    }
}

module.exports = {cleanupExpiredAndUsedTokens};