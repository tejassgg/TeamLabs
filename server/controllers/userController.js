exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, phoneExtension, address, city, state, zipCode, country } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.phoneExtension = phoneExtension || user.phoneExtension;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;
    user.country = country || user.country;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        phoneExtension: user.phoneExtension,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
}; 