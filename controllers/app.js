

const privateFunction = (req,res) => {
    console.log(`Private route accessed.`)
    return res.status(200).json({message: `Private route accessed`})
}

module.exports = {privateFunction};