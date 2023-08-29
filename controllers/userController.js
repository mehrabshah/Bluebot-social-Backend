const User = require('../models/User');
const bcrypt = require('bcrypt');
const Joi = require('joi');

// const userSchema = Joi.object({
//   email: Joi.string().email().required(),
//   password: Joi.string()
//       .required('Password is required')
//       .pattern(
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
//         'Password must contain at least one uppercase letter, one lowercase letter, one special character, and one numeric value'
//       ),
//   role: Joi.string().valid('ADMIN', 'DRIVER', 'PHARMACYMEMBER'),
//   name: Joi.string().required(),
//   surname: Joi.string().required(),
//   permissions: Joi.any(),
//   idPhoto: Joi.string(),
//   isDriver: Joi.boolean().required().allow(null),
//   assignedRoute: Joi.when('isDriver', {
//     is: true,
//     then: Joi.string().required(),
//     otherwise: Joi.string().allow(null),
//   }),
// });

async function getAllUsers(req, res) {
  try {
    const users = await User.findAll();
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
async function getDriver(req, res) {
  try {
    const Driver = await User.findAll({
      where: {
        role: 'DRIVER'
      }
    });
    return res.status(200).json(Driver);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getUserById(req, res) {
  try {
    const id = req.query.id;
    const user = await User.findOne({ where: { id: id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    delete user.dataValues.password;

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createUser(req, res) {
  try {
    const { error, value } = (req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password, name, surname, role } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      name,
      surname,
    });
    delete user.dataValues.password;

    return res
      .status(201)
      .json({ message: 'User created successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  try {
    const id = req.query.id;
    const { email } = req.body;
    const usertoUpdate = req.body;

    // Check if the user exists
    const user = await User.findOne(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      const mail = await User.findOne({ where: { email: email } });
      if (mail && mail.id !== id) {
        return res
          .status(409)
          .json({ message: 'Email already exists, choose a unique email' });
      }
    }

    await User.update(usertoUpdate, { where: { id: id } });
    delete user.dataValues.password;

    return res
      .status(200)
      .json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const id = req.query.id;

    // Check if the user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function adminPage(req, res) {
  return res.status(200).json({ message: 'This is Admin Page' });
}

async function homePage(req, res) {
  return res.status(200).json({ message: 'This is Home Page' });
}

async function dashboard(req, res) {
  return res.status(200).json({ message: 'This is dashboard' });
}

async function getUserProducts(req, res) {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve all products associated with the user
    const products = await Product.findAll({ where: { userId } });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  homePage,
  dashboard,
  adminPage,
  getUserProducts,
  getDriver
};
