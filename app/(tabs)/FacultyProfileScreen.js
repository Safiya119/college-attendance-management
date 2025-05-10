import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getFacultyProfile,
  updateFacultyProfile,
  changeFacultyPassword,
  deleteFacultyAccount,
  getSubjectsByDeptAndSem,
  checkSubjectAvailability
} from '../utils/api';
import { getAuthToken, removeAuthToken } from '../utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const ProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faculty, setFaculty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFaculty, setEditedFaculty] = useState(null);
  const [checkingSubjects, setCheckingSubjects] = useState(false);
  
  // UI state
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Subject selection state
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSelectionStep, setSubjectSelectionStep] = useState(1);

  useEffect(() => {
    fetchFacultyProfile();
  }, []);


  const fetchFacultyProfile = async () => {
    try {
      setLoading(true);
      const response = await getFacultyProfile();
      
      if (response.success) {
        setFaculty(response.faculty);
        setEditedFaculty(response.faculty);
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.error === 'Unauthorized' || error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
    setEditedFaculty(prev => ({
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

    setEditedFaculty(prev => ({
      ...prev,
      subjects: [...prev.subjects, ...newSubjects]
    }));

    setSelectedSubjects([]);
    setSubjectSelectionStep(1);
    setSubjectModalVisible(false);
  };

  const removeSubject = (index) => {
    const newSubjects = [...editedFaculty.subjects];
    newSubjects.splice(index, 1);
    setEditedFaculty(prev => ({
      ...prev,
      subjects: newSubjects
    }));
  };




  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await updateFacultyProfile(editedFaculty);
      
      if (response.success) {
        setFaculty(response.faculty);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };



  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      const response = await changeFacultyPassword(passwordData);
      
      if (response.success) {
        setPasswordModalVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        Alert.alert('Success', 'Password changed successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await deleteFacultyAccount();
      
      if (response.success) {
        await removeAuthToken();
        setDeleteConfirmVisible(false);
        Alert.alert('Account Deleted', 'Your account has been deleted', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error.error || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await removeAuthToken();
      router.replace('/(auth)/LoginScreen');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchFacultyProfile();
  };

  if (loading && !faculty) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitials}>
              {faculty?.name ? faculty.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{faculty?.name}</Text>
            <Text style={styles.department}>{faculty?.department} Department</Text>
            <View style={styles.idBadge}>
              <Ionicons name="school-outline" size={16} color="#333" />
              <Text style={styles.facultyId}>ID: {faculty?.facultyId}</Text>
            </View>
          </View>
        </View>
        
        {isEditing ? (
          // Edit Profile Form
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={editedFaculty?.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your name"
            />
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editedFaculty?.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setDepartmentModalVisible(true)}
            >
              <Text>{editedFaculty?.department}</Text>
              <Ionicons name="chevron-down" size={20} color="#777" />
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Subjects</Text>
            
            {editedFaculty?.subjects?.length > 0 ? (
              <View style={styles.subjectsList}>
                {editedFaculty.subjects.map((subject, index) => (
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
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noData}>No subjects added</Text>
            )}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedDept(editedFaculty?.department || 'CSE');
                setSelectedSemester(1);
                setAvailableSubjects([]);
                setSelectedSubjects([]);
                setSubjectSelectionStep(1);
                setSubjectModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.buttonText}>Add Subject</Text>
            </TouchableOpacity>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditedFaculty(faculty);
                  setIsEditing(false);
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View Profile 
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={18} color="#4a6baf" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{faculty?.name}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail" size={18} color="#4a6baf" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{faculty?.email}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="business" size={18} color="#4a6baf" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{faculty?.department}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="school" size={18} color="#4a6baf" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Faculty ID</Text>
                  <Text style={styles.infoValue}>{faculty?.facultyId}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subjects Teaching</Text>
              
              {faculty?.subjects?.length > 0 ? (
                <View style={styles.subjectListView}>
                  {faculty.subjects.map((subject, index) => (
                    <View key={index} style={styles.subjectItemView}>
                      <View style={styles.subjectBadge}>
                        <Text style={styles.subjectSemester}>S{subject.semester}</Text>
                      </View>
                      <View style={styles.subjectDetails}>
                        <Text style={styles.subjectNameView}>{subject.name}</Text>
                        <Text style={styles.subjectDeptView}>{subject.department}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noData}>No subjects assigned</Text>
              )}
            </View>
            
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#4a6baf" />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPasswordModalVisible(true)}
              >
                <Ionicons name="key-outline" size={20} color="#4a6baf" />
                <Text style={styles.actionButtonText}>Change Password</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={[styles.actionButtonText, {color: '#e74c3c'}]}>Logout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => setDeleteConfirmVisible(true)}
              >
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                <Text style={[styles.actionButtonText, {color: '#e74c3c'}]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
      
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
                    editedFaculty?.department === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleInputChange('department', item);
                    setDepartmentModalVisible(false);
                  }}
                >
                  <Text style={editedFaculty?.department === item ? styles.selectedModalItemText : styles.modalItemText}>
                    {item}
                  </Text>
                  {editedFaculty?.department === item && (
                    <Ionicons name="checkmark" size={20} color="#4a6baf" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDepartmentModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Subject Add Modal */}
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
      
      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
              placeholder="Enter current password"
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
              placeholder="Enter new password (min 6 characters)"
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
              placeholder="Confirm new password"
              secureTextEntry
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.modalSaveButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="warning" size={40} color="#e74c3c" />
            </View>
            
            <Text style={styles.confirmTitle}>Delete Account</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a6baf',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  facultyId: {
    fontSize: 12,
    color: '#34495e',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  subjectListView: {
    marginTop: 8,
  },
  subjectItemView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  subjectBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a6baf',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectSemester: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  subjectDetails: {
    flex: 1,
  },
  subjectNameView: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  subjectDeptView: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noData: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4a6baf',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9ed',
  },
  pickerButton: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 12,
  },
  subjectsList: {
    marginBottom: 16,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
    marginTop: 2,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4a6baf',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#4a6baf',
    marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    },
    modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 500,
    maxHeight: '80%',
    },
    modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
    },
    modalLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
    marginTop: 12,
    },
    modalInput: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9ed',
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
    modalSaveButton: {
    backgroundColor: '#4a6baf',
    marginLeft: 8,
    },
    modalSaveButtonText: {
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
    // Delete confirmation modal
    confirmModalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 350,
    },
    confirmIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdeaea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    },
    confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    },
    confirmText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    },
    confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    },
    confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    },
    confirmCancelButton: {
    backgroundColor: '#f1f2f6',
    marginRight: 8,
    },
    confirmCancelText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
    },
    confirmDeleteButton: {
    backgroundColor: '#e74c3c',
    marginLeft: 8,
    },
    confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    },
    // Loading overlay
    loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    },
    // Responsive adjustments
    '@media (min-width: 768px)': {
    contentContainer: {
    paddingHorizontal: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    },
    header: {
    padding: 24,
    },
    profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    },
    profileInitials: {
    fontSize: 40,
    },
    name: {
    fontSize: 24,
    },
    card: {
    padding: 24,
    },
    cardTitle: {
    fontSize: 20,
    },
    buttonRow: {
    justifyContent: 'flex-end',
    },
    button: {
    flex: 0,
    paddingHorizontal: 24,
    },
    infoRow: {
    marginBottom: 20,
    },
    infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    },
    modalContainer: {
    width: '70%',
    maxWidth: 600,
    },
    subjectsSelectionContainer: {
    maxHeight: 400,
    },
    },
    '@media (max-width: 360px)': {
    header: {
    flexDirection: 'column',
    alignItems: 'center',
    },
    profileImageContainer: {
    marginRight: 0,
    marginBottom: 16,
    },
    headerInfo: {
    alignItems: 'center',
    },
    buttonRow: {
    flexDirection: 'column',
    },
    cancelButton: {
    marginRight: 0,
    marginBottom: 12,
    },
    saveButton: {
    marginLeft: 0,
    },
    modalButtonRow: {
    flexDirection: 'column',
    },
    modalCancelButton: {
    marginRight: 0,
    marginBottom: 12,
    },
    modalAddButton: {
    marginLeft: 0,
    },
    modalSaveButton: {
    marginLeft: 0,
    },
    confirmButtonRow: {
    flexDirection: 'column',
    },
    confirmCancelButton: {
    marginRight: 0,
    marginBottom: 12,
    },
    confirmDeleteButton: {
    marginLeft: 0,
    },
    unavailableSubjectItem: {
      backgroundColor: '#fff5f5',
    },
    unavailableCheckbox: {
      borderColor: '#e74c3c',
      backgroundColor: '#ffebee',
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
    loadingSubjects: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    loadingText: {
      marginTop: 10,
      color: '#7f8c8d',
      fontSize: 14,
    }
    }
    });
    
    export default ProfileScreen;  