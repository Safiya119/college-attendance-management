import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFacultySubjects, getClassroomStudents, updateBulkMarks } from '../utils/api';

const AddMarkScreen = () => {
  const router = useRouter();
  const [examType, setExamType] = useState('cat1');
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchFacultySubjects();
  }, []);

  useEffect(() => {
    if (subject) {
      fetchStudentsForSubject();
    }
  }, [subject, examType]);

  const fetchFacultySubjects = async () => {
    try {
      setLoading(true);
      const response = await getFacultySubjects();
      
      if (response.success && response.subjects.length > 0) {
        setAvailableSubjects(response.subjects);
        
        if (response.subjects.length === 1) {
          handleSubjectSelect(response.subjects[0]);
        } else {
          setShowSubjectModal(true);
        }
      } else {
        Alert.alert(
          'No Subjects Assigned',
          'You are not assigned to any subjects. Please contact admin.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error fetching faculty subjects:', error);
      Alert.alert('Error', error.message || 'Failed to fetch your subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSubject = async () => {
    if (!subject) {
      console.log('No subject selected');
      return;
    }
  
    try {
      setLoading(true);cv

  
      // Simplified approach - make just one correct API call
      const response = await getClassroomStudents({
        subjectCode: subject.subjectCode,
        name: subject.name,
        department: subject.department,
        semester: subject.semester
      });
  
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch students');
      }
  
      if (!response.students || response.students.length === 0) {
        console.log('No students found in response:', response);
        setStudents([]);
        Alert.alert(
          'No Students Found', 
          `No students registered for ${subject.name} (${subject.subjectCode}) in ${subject.department} department, semester ${subject.semester}`
        );
        return;
      }
  
      
      const studentsWithMarks = response.students.map(student => {
        // Find matching subject key in student's marks
        const subjectKey = Object.keys(student.marks || {}).find(key => {
          const markData = student.marks[key];
          return (
            key === subject.subjectCode ||
            markData?.subjectName === subject.name
          );
        });
  
        let currentMark = '';
        let originalMark = '';
        
        if (subjectKey && student.marks?.[subjectKey]) {
          const markValue = student.marks[subjectKey][examType];
          currentMark = (markValue !== undefined && markValue !== null) ? markValue.toString() : '';
          originalMark = currentMark;
        }
  
        return {
          ...student,
          currentMark,
          originalMark,
          isModified: false
        };
      });
  
      setStudents(studentsWithMarks);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      
      let errorMessage = `Failed to fetch students for ${subject?.name || 'the selected subject'}`;
      
      if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
  
      Alert.alert('Fetch Error', errorMessage);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (selectedSubject) => {
    setSubject(selectedSubject);
    setShowSubjectModal(false);
    setIsEditMode(false); // Reset edit mode when subject changes
  };

  const handleMarkChange = (registerNumber, value) => {
    const numericValue = parseFloat(value);
    if (value === '' || (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.registerNumber === registerNumber 
            ? { 
                ...student, 
                currentMark: value, 
                isModified: value !== student.originalMark 
              } 
            : student
        )
      );
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Reset any unsaved changes when exiting edit mode
      setStudents(prevStudents => 
        prevStudents.map(student => ({
          ...student,
          currentMark: student.originalMark,
          isModified: false
        }))
      );
    }
    setIsEditMode(prevMode => !prevMode);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!subject) {
        throw new Error("No subject selected");
      }
  
      // Filter out students whose marks haven't changed
      const modifiedStudents = students.filter(
        s => s.isModified
      );
  
      if (modifiedStudents.length === 0) {
        Alert.alert("No Changes", "No marks have been modified");
        return;
      }

  
      const response = await updateBulkMarks({
        department: subject.department,
        semester: subject.semester,
        subjectCode: subject.subjectCode, // Changed from subjectName to subject.code
        examType,
        marksData: modifiedStudents.map(s => ({
          registerNumber: s.registerNumber,
          marks: s.currentMark === '' ? null : parseFloat(s.currentMark)
        }))
      });
  
      if (!response.success) {
        throw new Error(response.error || "Failed to save marks");
      }
  
      Alert.alert('Success', 'Marks updated successfully!');
      // Update original marks to reflect the saved changes
      setStudents(prevStudents =>
        prevStudents.map(student => ({
          ...student,
          originalMark: student.currentMark,
          isModified: false
        }))
      );
      setIsEditMode(false);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || "Failed to save marks"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentsForSubject().finally(() => setRefreshing(false));
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNo?.toString().includes(searchQuery)
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a6baf']}
              tintColor="#4a6baf"
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <AntDesign name="arrowleft" size={24} color="#4a6baf" />
            </TouchableOpacity>
            <Text style={styles.title}>Manage Marks</Text>
            {subject && (
              <TouchableOpacity 
                onPress={() => setShowSubjectModal(true)}
                style={styles.changeSubjectButton}
              >
                <Text style={styles.changeSubjectText}>Change Subject</Text>
              </TouchableOpacity>
            )}
          </View>

          {subject ? (
            <>
              <View style={styles.classInfoContainer}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectText} numberOfLines={1}>
                    {subject.name} ({subject.subjectCode})
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowSubjectModal(true)}
                    style={styles.subjectChangeButton}
                  >
                    
                  </TouchableOpacity>
                </View>
                <Text style={styles.classInfoText}>
                  {subject.department} • Semester {subject.semester}
                </Text>
                
                <View style={styles.examModeRow}>
                  <View style={styles.examTypeRow}>
                    <Text style={styles.examTypeLabel}>Exam Type:</Text>
                    <View style={styles.examTypePicker}>
                      <Picker
                        selectedValue={examType}
                        onValueChange={setExamType}
                        dropdownIconColor="#4a6baf"
                        mode="dropdown"
                      >
                        <Picker.Item label="CAT 1" value="cat1" />
                        <Picker.Item label="CAT 2" value="cat2" />
                        <Picker.Item label="Model Exam" value="modelExam" />
                      </Picker>
                    </View>
                  </View>
                 
                </View>
              </View>

              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#777" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <MaterialIcons name="close" size={18} color="#777" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.tableHeader}>
                <View style={styles.studentInfoHeader}>
                  <Text style={styles.headerText}>Student</Text>
                </View>
                <View style={styles.marksHeader}>
                  <Text style={styles.headerText}>Marks</Text>
                </View>
              </View>

              {filteredStudents.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <MaterialIcons name="person-search" size={50} color="#ddd" />
                  <Text style={styles.noResultsText}>No students found</Text>
                  {searchQuery ? (
                    <TouchableOpacity 
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButtonBig}
                    >
                      <Text style={styles.clearSearchText}>Clear search</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                filteredStudents.map((student) => (
                  <View key={student.registerNumber} style={styles.studentRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={styles.studentDetails}>
                        {student.registerNumber} • Roll: {student.rollNo || 'N/A'}
                      </Text>
                    </View>
                    
                    {isEditMode ? (
                      // In your student row rendering code:
<TextInput
  style={[
    styles.marksInput,
    student.currentMark === '' && styles.emptyMarksInput,
    (parseFloat(student.currentMark) < 0 || parseFloat(student.currentMark) > 100) && 
      styles.invalidMarksInput,
    student.isModified && styles.marksInputModified
  ]}
  keyboardType="decimal-pad"
  placeholder="0-100"
  placeholderTextColor="#999"
  value={student.currentMark} // No need for toString() here now
  onChangeText={(text) => handleMarkChange(student.registerNumber, text)}
  maxLength={5}
  returnKeyType="done"
/>
                    ) : (
                      <View style={styles.markDisplayContainer}>
                        <Text style={styles.markDisplayText}>
                          {student.originalMark === '' ? 'N/A' : student.originalMark}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}

              <View style={styles.footer}>
                {isEditMode ? (
                  <TouchableOpacity 
                    style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={20} color="#fff" style={styles.saveIcon} />
                        <Text style={styles.saveButtonText}>Save Marks</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.editAllButton}
                    onPress={toggleEditMode}
                  >
                    <MaterialIcons name="edit" size={20} color="#fff" style={styles.editIcon} />
                    <Text style={styles.editAllButtonText}>Edit All Marks</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.studentCount}>
                  Showing {filteredStudents.length} of {students.length} student(s)
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noSubjectContainer}>
              <MaterialIcons name="subject" size={50} color="#ddd" />
              <Text style={styles.noSubjectText}>No subject selected</Text>
              <TouchableOpacity
                style={styles.selectSubjectButton}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text style={styles.selectSubjectButtonText}>Select Subject</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            
            <View style={styles.searchContainerModal}>
              <MaterialIcons name="search" size={20} color="#777" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInputModal}
                placeholder="Search subjects..."
                placeholderTextColor="#999"
                onChangeText={(text) => {
                  // Implement search functionality if you have many subjects
                }}
              />
            </View>
            
            <ScrollView style={styles.subjectsList}>
              {availableSubjects.map((subj, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.subjectItem,
                    subject?.code === subj.code && styles.selectedSubjectItem
                  ]}
                  onPress={() => handleSubjectSelect(subj)}
                >
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{subj.name}</Text>
                    <Text style={styles.subjectCode}>{subj.code}</Text>
                  </View>
                  <Text style={styles.subjectDetails}>
                    {subj.department} • Sem {subj.semester}
                  </Text>
                  {subject?.code === subj.code && (
                    <MaterialIcons name="check" size={20} color="#4a6baf" style={styles.selectedIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (!subject) {
                    router.back();
                  }
                  setShowSubjectModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  changeSubjectButton: {
    padding: 8,
  },
  changeSubjectText: {
    color: '#4a6baf',
    fontWeight: '600',
    fontSize: 14,
  },
  classInfoContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  subjectText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subjectChangeButton: {
    padding: 5,
    marginLeft: 10,
  },
  classInfoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  examTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  examTypeLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
  examTypePicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearSearchButton: {
    padding: 5,
    marginLeft: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#4a6baf',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  studentInfoHeader: {
    flex: 3,
  },
  marksHeader: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  studentInfo: {
    flex: 3,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 3,
  },
  studentDetails: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  marksInput: {
    width: 80,
    height: 45,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#4a6baf',
    backgroundColor: '#f8f9fa',
  },
  emptyMarksInput: {
    color: '#999',
    fontWeight: 'normal',
  },
  invalidMarksInput: {
    borderColor: '#e74c3c',
    backgroundColor: '#fde8e6',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#95a5a6',
  },
  clearSearchButtonBig: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#4a6baf',
    fontWeight: '500',
  },
  noSubjectContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noSubjectText: {
    marginTop: 10,
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 20,
  },
  selectSubjectButton: {
    backgroundColor: '#4a6baf',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  selectSubjectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#4a6baf',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a6baf',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveIcon: {
    marginRight: 10,
  },
  studentCount: {
    textAlign: 'center',
    marginTop: 10,
    color: '#95a5a6',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchContainerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchInputModal: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  subjectsList: {
    marginBottom: 15,
  },
  subjectItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSubjectItem: {
    backgroundColor: '#f5f8ff',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subjectCode: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  subjectDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 10,
  },
  selectedIcon: {
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  // Add these to your existing StyleSheet:
examModeRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 15,
},
editModeButton: {
  backgroundColor: '#4a6baf',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
},
viewModeButton: {
  backgroundColor: '#27ae60',
},
editModeIcon: {
  marginRight: 5,
},
editModeButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
markDisplayContainer: {
  width: 80,
  height: 45,
  borderRadius: 8,
  backgroundColor: '#f0f4f8',
  justifyContent: 'center',
  alignItems: 'center',
},
markDisplayText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#2c3e50',
},
editAllButton: {
  backgroundColor: '#3498db',
  borderRadius: 10,
  paddingVertical: 15,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#3498db',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 3,
},
editAllButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},
editIcon: {
  marginRight: 10,
},
marksInputModified: {
  backgroundColor: '#e8f4fc',
  borderColor: '#3498db',
}
});

export default AddMarkScreen;