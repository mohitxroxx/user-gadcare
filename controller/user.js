const user = require('../models/user')

const registerUser = async (userData) => {
  try {
    return await user.create(userData)
  } catch (error) {
    console.error('Error registering user:', error)
    throw error
  }
}

module.exports = {registerUser}
