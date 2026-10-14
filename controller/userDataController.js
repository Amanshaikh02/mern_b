import userData from "../model/user.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/jwtUtils.js";
import cloudinery, { proxyAgent } from "../config/cloudinery.js";

const uploadToCloudinery = (buffer) => {

  return new Promise((resolve,reject) => {

    const stream = cloudinery.uploader.upload_stream(

      { folder: 'divb_user', agent: proxyAgent},
      (error, result) => {

          if (error) return reject(error)
          resolve(result)
      })
    stream.end(buffer)
  })
}

// Add user
export const addUser = async (req, res) => {
  try {
    const password = await bcrypt.hash(req.body.password, 10);

    let imageUrl = ""
    if (req.file){
        
      const result = await uploadToCloudinery(req.file.buffer)
      imageUrl = result.secure_url

    }

    const userDataval = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      password: password,
      image:imageUrl
    };

    const saveUserData = await userData.create(userDataval);

    res.status(201).json({
      message: "User added successfully",
      data: saveUserData,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Get all users
export const getUser = async (req, res) => {
  try {
    const getUserData = await userData.find();

    res.status(200).json({
      message: "Users retrieved successfully",
      data: getUserData,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Get single user
export const getSingleUser = async (req, res) => {
  try {
    const id = req.params.uid;
    const singleUserData = await userData.findById(id);

    if (!singleUserData) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      data: singleUserData,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Delete user
export const deleteUSer = async (req, res) => {
  try {
    const id = req.params.uid;
    const deletedUserData = await userData.findByIdAndDelete(id);

    if (!deletedUserData) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
      data: deletedUserData,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const id = req.params.uid;

    const userDataVal = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    // Ignore fields that were not supplied
    Object.keys(userDataVal).forEach((key) => {
      if (userDataVal[key] === undefined) {
        delete userDataVal[key];
      }
    });

    const updatedUserData = await userData.findByIdAndUpdate(
      id,
      userDataVal,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUserData) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUserData,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        status: 0,
      });
    }

    const uData = await userData.findOne({ email });

    if (!uData) {
      return res.status(401).json({
        message: "Invalid email or password",
        status: 0,
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      uData.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
        status: 0,
      });
    }

    const token = await generateToken(uData);

    // Do not return the stored password to the frontend
    const safeUserData = uData.toObject();
    delete safeUserData.password;

    return res.status(200).json({
      message: "Login successful",
      status: 1,
      data: safeUserData,
      token,
    });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};