import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Fingerprint = () => {
  const [form, setForm] = useState({
    finger_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirm_password: ""
  });

  const [searchPhone, setSearchPhone] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [esp32Ip, setEsp32Ip] = useState("http://192.168.137.50");
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchPhone(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error("Passwords don't match!");
      return;
    }

    try {
      const { confirm_password, ...submitData } = form;
      
      if (isEditing) {
        // Update existing user
        const res = await axios.put(
          `http://localhost:5002/api/user/${form.finger_id}`,
          submitData
        );
        toast.success("User updated successfully!");
      } else {
        // Register new user
        if (!form.finger_id) {
          toast.error("Please enroll a fingerprint first.");
          return;
        }
        const res = await axios.post(
          "http://localhost:5002/api/user/register", 
          submitData
        );
        toast.success("User registered successfully!");
      }
      
      resetForm();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                      "Server error during operation";
      toast.error(errorMsg);
      console.error("Operation error:", error);
    }
  };

  const resetForm = () => {
    setForm({
      finger_id: "",
      first_name: "",
      last_name: "",
      phone: "",
      password: "",
      confirm_password: ""
    });
    setSearchPhone("");
    setIsEditing(false);
    fetchLatestFingerId();
  };

  const fetchLatestFingerId = async () => {
    try {
      const res = await axios.get("http://localhost:5002/api/user/latest");
      const nextId = res.data?.id ? parseInt(res.data.id) + 1 : 1;
      setForm(prev => ({ ...prev, finger_id: nextId }));
    } catch (error) {
      console.error("Error fetching latest finger ID:", error);
      toast.error("Couldn't fetch fingerprint data");
    }
  };

  const handleSearch = async () => {
    if (!searchPhone) {
      toast.error("Please enter a phone number to search");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5002/api/user/phone/${searchPhone}`
      );
      
      if (res.data) {
        setForm({
          finger_id: res.data.finger_id,
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          phone: res.data.phone,
          password: "", // Don't show actual password
          confirm_password: ""
        });
        setIsEditing(true);
        toast.success("User found!");
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      toast.error("Error searching for user");
      console.error("Search error:", error);
    }
  };

  const handleDelete = async () => {
    if (!form.finger_id || !isEditing) {
      toast.error("No user selected to delete");
      return;
    }

    try {
      if (window.confirm("Are you sure you want to delete this user?")) {
        await axios.delete(
          `http://localhost:5002/api/user/${form.finger_id}`
        );
        toast.success("User deleted successfully");
        resetForm();
      }
    } catch (error) {
      toast.error("Error deleting user");
      console.error("Delete error:", error);
    }
  };

  const handleEnroll = async () => {
    if (isEditing) {
      toast.error("Cannot enroll fingerprint for existing user");
      return;
    }

    setEnrolling(true);
    try {
      await fetchLatestFingerId();
      
      if (!form.finger_id) {
        throw new Error("Couldn't determine next slot");
      }

      toast.loading("Enrolling fingerprint... Place finger on sensor");
      
      const response = await axios.get(
        `${esp32Ip}/enroll?slot=${form.finger_id}`,
        { timeout: 10000 }
      );
      
      if (response.data.status === "enrolling") {
        toast.dismiss();
        toast.success("Follow instructions on device");
      } else {
        throw new Error("Enrollment failed to start");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`Enrollment failed: ${error.message}`);
      console.error("Enrollment error:", error);
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    fetchLatestFingerId();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-right" />
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Fingerprint Registration
        </h2>
        
        {/* Search Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-gray-700 mb-2">Search by Phone Number</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={searchPhone}
              onChange={handleSearchChange}
              className="flex-1 px-4 py-2 border rounded-md"
              placeholder="Enter phone number"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Search
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fingerprint ID Field */}
          <div>
            <label className="block text-gray-700 mb-1">Fingerprint ID</label>
            <input
              type="number"
              name="finger_id"
              value={form.finger_id}
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
              readOnly
            />
          </div>

          {/* Personal Information Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required={!isEditing}
                minLength="5"
                placeholder={isEditing ? "Leave blank to keep current" : ""}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required={!isEditing}
                minLength="5"
                placeholder={isEditing ? "Leave blank to keep current" : ""}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between items-center pt-4 gap-2">
            <button
              type="button"
              className={`bg-green-600 text-white py-2 px-4 rounded-md 
                ${(enrolling || isEditing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
              onClick={handleEnroll}
              disabled={enrolling || isEditing}
            >
              {enrolling ? (
                <span className="animate-pulse">Enrolling...</span>
              ) : (
                "Enroll Fingerprint"
              )}
            </button>

            <div className="flex gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  Delete
                </button>
              )}
              
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md"
              >
                {isEditing ? "Update" : "Register"}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Fingerprint;