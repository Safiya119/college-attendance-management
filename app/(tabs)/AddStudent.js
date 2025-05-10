import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import { addStudent } from "../utils/api";
import { router } from "expo-router";

const departments = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];

const AddStudentScreen = () => {
  const [formData, setFormData] = useState({
    registerNumber: "",
    rollNo: "",
    name: "",
    email: "",
    guardianContacts: [
      {
        relation: "Father",
        name: "",
        phone: "",
        alternatePhone: "",
        email: "",
      },
    ],
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    parentsNumber: "",
    department: "CSE",
    classroom: "",
    semester: 1,
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.registerNumber.trim()) {
      newErrors.registerNumber = "Register number is required";
      isValid = false;
    }

    if (!formData.name.trim()) {
      newErrors.name = "Student name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.parentsNumber.trim()) {
      newErrors.parentsNumber = "Parent's phone number is required";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formData.parentsNumber)) {
      newErrors.parentsNumber = "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    if (!formData.classroom.trim()) {
      newErrors.classroom = "Classroom is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await addStudent(formData);
      if (response.success) {
        Alert.alert("Success", "Student added successfully with subjects", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/StudentDetailsScreen"),
          },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to add student");
      }
    } catch (error) {
      console.error("Add student error:", error);
      Alert.alert("Error", error.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#4a6baf" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Student</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.card}>
          {/* Register Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Register Number *</Text>
            <TextInput
              style={[styles.input, errors.registerNumber && styles.errorInput]}
              placeholder="Enter Register Number"
              placeholderTextColor="#999"
              value={formData.registerNumber}
              onChangeText={(text) => handleChange("registerNumber", text)}
            />
            {errors.registerNumber && (
              <Text style={styles.errorText}>{errors.registerNumber}</Text>
            )}
          </View>

          {/* Roll No */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Roll No</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Roll Number"
              placeholderTextColor="#999"
              value={formData.rollNo}
              onChangeText={(text) => handleChange("rollNo", text)}
            />
          </View>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.errorInput]}
              placeholder="Enter Student Name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.errorInput]}
              placeholder="Enter Student Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Parents Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}> Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.parentsNumber && styles.errorInput]}
              placeholder="Enter Parents Number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.parentsNumber}
              onChangeText={(text) => handleChange("parentsNumber", text)}
            />
            {errors.parentsNumber && (
              <Text style={styles.errorText}>{errors.parentsNumber}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Guardian Name *</Text>
            <TextInput
              style={[styles.input, errors.fatherName && styles.errorInput]}
              placeholder="Enter Father's Name"
              value={formData.guardianContacts[0].name}
              onChangeText={(text) =>
                handleChange("guardianContacts", [
                  { ...formData.guardianContacts[0], name: text },
                ])
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Guardian Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.fatherPhone && styles.errorInput]}
              placeholder="Enter Father's Phone"
              keyboardType="phone-pad"
              value={formData.guardianContacts[0].phone}
              onChangeText={(text) =>
                handleChange("guardianContacts", [
                  { ...formData.guardianContacts[0], phone: text },
                ])
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              value={formData.address.street}
              onChangeText={(text) =>
                handleChange("address", {
                  ...formData.address,
                  street: text,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.address.city}
              onChangeText={(text) =>
                handleChange("address", {
                  ...formData.address,
                  city: text,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="State"
              value={formData.address.state}
              onChangeText={(text) =>
                handleChange("address", {
                  ...formData.address,
                  state: text,
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Pincode"
              keyboardType="number-pad"
              value={formData.address.pincode}
              onChangeText={(text) =>
                handleChange("address", {
                  ...formData.address,
                  pincode: text,
                })
              }
            />
          </View>

          {/* Department */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department *</Text>
            <View
              style={[
                styles.pickerContainer,
                errors.department && styles.errorInput,
              ]}
            >
              <Picker
                selectedValue={formData.department}
                onValueChange={(itemValue) =>
                  handleChange("department", itemValue)
                }
                style={styles.picker}
              >
                {departments.map((dept, index) => (
                  <Picker.Item key={index} label={dept} value={dept} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Classroom */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Classroom *</Text>
            <TextInput
              style={[styles.input, errors.classroom && styles.errorInput]}
              placeholder="Enter Classroom"
              placeholderTextColor="#999"
              value={formData.classroom}
              onChangeText={(text) => handleChange("classroom", text)}
            />
            {errors.classroom && (
              <Text style={styles.errorText}>{errors.classroom}</Text>
            )}
          </View>

          {/* Semester */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Semester *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.semester}
                onValueChange={(itemValue) =>
                  handleChange("semester", itemValue)
                }
                style={styles.picker}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <Picker.Item
                    key={sem}
                    label={`Semester ${sem}`}
                    value={sem}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Any remarks about the student"
              placeholderTextColor="#999"
              value={formData.remarks}
              onChangeText={(text) => handleChange("remarks", text)}
              multiline
            />
          </View>
        </View>

        <Button
          title={loading ? "Adding Student..." : "Add Student"}
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={loading}
          icon={
            loading ? <ActivityIndicator color="#fff" size="small" /> : null
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 5,
  },
  headerPlaceholder: {
    width: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#4a6baf",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    fontSize: 16,
    color: "#333",
  },
  errorInput: {
    borderColor: "#ff4444",
    backgroundColor: "#fff9f9",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 13,
    marginTop: 5,
    marginLeft: 5,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#4a6baf",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    shadowColor: "#4a6baf",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AddStudentScreen;
