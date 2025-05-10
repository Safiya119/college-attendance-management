import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Button from '../components/Button';
import { editStudent } from '../utils/api';
import { router } from 'expo-router';

const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

const EditStudentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { student } = route.params;
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    registerNumber: student.registerNumber,
    rollNo: student.rollNo,
    name: student.name,
    email: student.email,
    guardianContacts: student.guardianContacts || [
      {
        relation: 'Father',
        name: '',
        phone: '',
        alternatePhone: '',
        email: ''
      }
    ],
    address: student.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    parentsNumber: student.parentsNumber,
    department: student.department,
    classroom: student.classroom,
    semester: student.semester,
    remarks: student.remarks || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.registerNumber || !formData.name || !formData.email || !formData.parentsNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await editStudent({
        registerNumber: student.registerNumber,
        ...formData
      });
      
      if (response.success) {
        Alert.alert('Success', 'Student updated successfully', [
          { 
            text: 'OK', 
            onPress: () => router.replace('StudentDetailsScreen')
          }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update student');
      }
    } catch (error) {
      Alert.alert('Error', error.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edit Student</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Register Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#eee', color: '#777' }]}
          value={formData.registerNumber}
          editable={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Roll No</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Roll Number"
          value={formData.rollNo}
          onChangeText={(text) => handleChange('rollNo', text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Student Name"
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#eee', color: '#777' }]}
          value={formData.email}
          editable={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Parents Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Parents Number"
          keyboardType="phone-pad"
          value={formData.parentsNumber}
          onChangeText={(text) => handleChange('parentsNumber', text)}
        />
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Department *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.department}
            onValueChange={(itemValue) => handleChange('department', itemValue)}
            style={styles.picker}
          >
            {departments.map((dept, index) => (
              <Picker.Item key={index} label={dept} value={dept} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Classroom *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Classroom"
          value={formData.classroom}
          onChangeText={(text) => handleChange('classroom', text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Semester *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.semester}
            onValueChange={(itemValue) => handleChange('semester', itemValue)}
            style={styles.picker}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <Picker.Item key={sem} label={`Semester ${sem}`} value={sem} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any remarks about the student"
          value={formData.remarks}
          onChangeText={(text) => handleChange('remarks', text)}
          multiline
        />
      </View>

      <Button 
        title={loading ? 'Updating...' : 'Update Student'} 
        onPress={handleSubmit} 
        style={styles.submitButton}
        disabled={loading}
      />

<Button
  title="Cancel"
  onPress={() => router.replace('/(tabs)/StudentDetailsScreen')}  // Correct way
  style={styles.submitButton}
/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#4a6baf',
  },
});

export default EditStudentScreen;