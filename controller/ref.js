const ref = require('../models/user')

const gencode = async () => {
  let isUnique = false
  let refcode

  while (!isUnique) {
    refcode = Math.random().toString().substr(2, 6)
    const chk = await ref.findOne({ refid: refcode })
    isUnique = !chk
  }
  return refcode
}
module.exports = {gencode}
