const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

mongoose.connect('mongodb+srv://hassanshahzadvs:WvFkVLdzQ2GWJkBt@cluster0.mpfkmzl.mongodb.net/?retryWrites=true&w=majority')
.then(()=>app.listen(8000,()=>
console.log(`Connection ok`)))
.catch((err)=>console.log('error',err))
// db.once('connected', () => {
//   console.log('db connected')
// })
// db.once('error', () => {
//   console.log(error)
// })
module.exports = db
