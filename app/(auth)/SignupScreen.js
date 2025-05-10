import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { storeAuthToken, getAuthToken } from '../utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { 
  checkSubjectAvailability,
  facultySignup,
  getSubjectsByDeptAndSem
} from '../utils/api';

const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const SignupScreen = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingSubjects, setCheckingSubjects] = useState(false);
  
  // Form Data State
  const [facultyData, setFacultyData] = useState({
    facultyId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'CSE',
    subjects: []
  });

  // UI State
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  
  // Subject Selection State
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSelectionStep, setSubjectSelectionStep] = useState(1);
  const [takenSubjects, setTakenSubjects] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      if (token) {
        router.replace('/(tabs)');
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const fetchSubjectsWithAvailability = async (department, semester) => {
    try {
      setCheckingSubjects(true);
      const response = await getSubjectsByDeptAndSem(department, semester);
      
      if (response.success) {
        const subjectsWithAvailability = await Promise.all(
          response.subjects.map(async subject => {
            try {
              const availability = await checkSubjectAvailability(subject.subjectCode);
              return {
                ...subject,
                available: availability.available,
                takenBy: availability.takenBy
              };
            } catch (error) {
              console.error('Error checking subject:', subject.subjectCode, error);
              return {
                ...subject,
                available: true,
                takenBy: null
              };
            }
          })
        );
        
        setAvailableSubjects(subjectsWithAvailability);
        
        const takenMap = {};
        subjectsWithAvailability.forEach(subject => {
          if (!subject.available && subject.takenBy) {
            takenMap[subject.subjectCode] = subject.takenBy;
          }
        });
        setTakenSubjects(takenMap);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'Failed to load subjects. Please try again.');
    } finally {
      setCheckingSubjects(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFacultyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeptSemSelect = () => {
    fetchSubjectsWithAvailability(selectedDept, selectedSemester);
    setSubjectSelectionStep(2);
  };

  const toggleSubjectSelection = (subject) => {
    if (!subject.available) {
      Alert.alert(
        'Subject Already Assigned',
        `This subject is already assigned to ${subject.takenBy.name} (${subject.takenBy.facultyId}). Please select another subject.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedSubjects(prev => {
      const isSelected = prev.some(s => s._id === subject._id);
      if (isSelected) {
        return prev.filter(s => s._id !== subject._id);
      } else {
        return [...prev, subject];
      }
    });
  };

  const confirmSubjectSelection = () => {
    const newSubjects = selectedSubjects.map(subject => ({
      _id: subject._id,
      subjectCode: subject.subjectCode,
      name: subject.subjectName,
      department: subject.department,
      semester: subject.semester
    }));

    setFacultyData(prev => ({
      ...prev,
      subjects: [...prev.subjects, ...newSubjects]
    }));

    setSelectedSubjects([]);
    setSubjectSelectionStep(1);
    setSubjectModalVisible(false);
  };

  const removeSubject = (index) => {
    setFacultyData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!facultyData.facultyId || !facultyData.name || !facultyData.email || 
        !facultyData.password || !facultyData.department) {
      Alert.alert('Validation Error', 'All fields marked with * are required.');
      return false;
    }
    
    if (facultyData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return false;
    }

    if (facultyData.password !== facultyData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = facultyData;
      const response = await facultySignup(dataToSend);

      if (response.success) {
        await storeAuthToken(response.token);
        Alert.alert(
          'Registration Successful', 
          'Your faculty account has been created.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Error', response.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup Error:', error);
      Alert.alert('Error', error.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/clg_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>ABDUL HAKEEM COLLEGE</Text>
            <Text style={styles.subtitle}>Faculty Registration</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <Text style={styles.label}>Faculty ID*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Faculty ID"
              value={facultyData.facultyId}
              onChangeText={(text) => handleInputChange('facultyId', text)}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Full Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={facultyData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={facultyData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Department*</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setDepartmentModalVisible(true)}
            >
              <Text style={styles.pickerButtonText}>{facultyData.department}</Text>
              <Ionicons name="chevron-down" size={20} color="#777" />
            </TouchableOpacity>

            <Text style={styles.label}>Password*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password (min 6 characters)"
              value={facultyData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password*</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={facultyData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
            />

            <Text style={styles.sectionTitle}>Subjects You Teach</Text>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedDept(facultyData.department);
                setSelectedSemester(1);
                setAvailableSubjects([]);
                setSelectedSubjects([]);
                setSubjectSelectionStep(1);
                setSubjectModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add Subjects</Text>
            </TouchableOpacity>
            
            {facultyData.subjects.length > 0 ? (
              <View style={styles.subjectsList}>
                <Text style={styles.subjectsListTitle}>Added Subjects:</Text>
                {facultyData.subjects.map((subject, index) => (
                  <View key={index} style={styles.subjectItem}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectDetails}>
                        {subject.department} - Semester {subject.semester}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeSubject(index)}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noSubjects}>No subjects added yet</Text>
            )}

            <Text style={styles.requiredNote}>* Required fields</Text>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.signupButtonText}>Create Faculty Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Department Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={departmentModalVisible}
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <FlatList
              data={departments}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    facultyData.department === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleInputChange('department', item);
                    setDepartmentModalVisible(false);
                  }}
                >
                  <Text style={facultyData.department === item ? styles.selectedModalItemText : styles.modalItemText}>
                    {item}
                  </Text>
                  {facultyData.department === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#007BFF" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setDepartmentModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={subjectModalVisible}
        onRequestClose={() => {
          setSubjectModalVisible(false);
          setSubjectSelectionStep(1);
          setSelectedSubjects([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>
              {subjectSelectionStep === 1 ? 'Select Department & Semester' : 'Select Subjects'}
            </Text>
            
            {subjectSelectionStep === 1 ? (
              <>
                <Text style={styles.modalLabel}>Department</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedDept}
                    onValueChange={(itemValue) => setSelectedDept(itemValue)}
                  >
                    {departments.map(dept => (
                      <Picker.Item key={dept} label={dept} value={dept} />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.modalLabel}>Semester</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedSemester}
                    onValueChange={(itemValue) => setSelectedSemester(itemValue)}
                  >
                    {semesters.map(sem => (
                      <Picker.Item key={sem} label={`Semester ${sem}`} value={sem} />
                    ))}
                  </Picker>
                </View>
                
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setSubjectModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalAddButton]}
                    onPress={handleDeptSemSelect}
                  >
                    <Text style={styles.modalAddButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.deptSemInfo}>
                  <Text style={styles.deptSemText}>
                    {selectedDept} - Semester {selectedSemester}
                  </Text>
                  <TouchableOpacity
                    style={styles.changeDeptSemButton}
                    onPress={() => setSubjectSelectionStep(1)}
                  >
                    <Text style={styles.changeDeptSemText}>Change</Text>
                  </TouchableOpacity>
                </View>
                
                {checkingSubjects ? (
                  <View style={styles.loadingSubjects}>
                    <ActivityIndicator size="large" color="#4a6baf" />
                    <Text style={styles.loadingText}>Checking subject availability...</Text>
                  </View>
                ) : availableSubjects.length > 0 ? (
                  <View style={styles.subjectsSelectionContainer}>
                    <FlatList
                      data={availableSubjects}
                      keyExtractor={(item) => item._id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.subjectSelectionItem,
                            selectedSubjects.some(s => s._id === item._id) && styles.selectedSubjectItem,
                            !item.available && styles.unavailableSubjectItem
                          ]}
                          onPress={() => toggleSubjectSelection(item)}
                          disabled={!item.available}
                        >
                          <View style={[
                            styles.subjectCheckbox,
                            !item.available && styles.unavailableCheckbox
                          ]}>
                            {selectedSubjects.some(s => s._id === item._id) && (
                              <Ionicons name="checkmark" size={16} color="#4a6baf" />
                            )}
                            {!item.available && (
                              <Ionicons name="close" size={16} color="#e74c3c" />
                            )}
                          </View>
                          <View style={styles.subjectSelectionInfo}>
                            <Text style={[
                              styles.subjectSelectionCode,
                              !item.available && styles.unavailableText
                            ]}>{item.subjectCode}</Text>
                            <Text style={[
                              styles.subjectSelectionName,
                              !item.available && styles.unavailableText
                            ]}>{item.subjectName}</Text>
                            {!item.available && (
                              <Text style={styles.takenByText}>
                                Taken by: {item.takenBy.name} ({item.takenBy.facultyId})
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      )}
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  </View>
                ) : (
                  <View style={styles.noSubjectsAvailable}>
                    <Ionicons name="alert-circle-outline" size={40} color="#95a5a6" />
                    <Text style={styles.noSubjectsText}>No subjects available for this department and semester</Text>
                  </View>
                )}
                
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      setSubjectModalVisible(false);
                      setSubjectSelectionStep(1);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.modalAddButton,
                      (selectedSubjects.length === 0 || checkingSubjects) && styles.disabledButton
                    ]}
                    onPress={confirmSubjectSelection}
                    disabled={selectedSubjects.length === 0 || checkingSubjects}
                  >
                    <Text style={styles.modalAddButtonText}>
                      {checkingSubjects ? 'Checking...' : 
                       `Add ${selectedSubjects.length > 0 ? `(${selectedSubjects.length})` : ''} Subjects`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 0,
  },
  logo: {
    width: 230,
    height: 230,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 0,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  formContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
  },
  pickerButton: {
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
  },
  pickerButtonText: {
    color: '#333',
  },
  addButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 5,
  },
  subjectsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  subjectsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2c3e50',
  },
  subjectDetails: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 3,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  noSubjects: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  requiredNote: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 5,
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModalItem: {
    backgroundColor: '#e6f2ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedModalItemText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '500',
  },
  modalCancelButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    marginTop: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f5f7fa',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f1f2f6',
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  modalAddButton: {
    backgroundColor: '#4a6baf',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deptSemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f7ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  deptSemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a6baf',
  },
  changeDeptSemButton: {
    padding: 5,
  },
  changeDeptSemText: {
    fontSize: 12,
    color: '#4a6baf',
    textDecorationLine: 'underline',
  },
  subjectsSelectionContainer: {
    maxHeight: 300,
    marginBottom: 15,
  },
  subjectSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  selectedSubjectItem: {
    backgroundColor: '#f1f7ff',
  },
  unavailableSubjectItem: {
    backgroundColor: '#fff5f5',
  },
  subjectCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4a6baf',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableCheckbox: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffebee',
  },
  subjectSelectionInfo: {
    flex: 1,
  },
  subjectSelectionCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  subjectSelectionName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  unavailableText: {
    color: '#95a5a6',
    textDecorationLine: 'line-through',
  },
  takenByText: {
    fontSize: 11,
    color: '#e74c3c',
    marginTop: 3,
    fontStyle: 'italic',
  },
  noSubjectsAvailable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noSubjectsText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingSubjects: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
});

export default SignupScreen;