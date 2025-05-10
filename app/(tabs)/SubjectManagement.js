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
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { getAllSubjects, addNewSubject, getSubjectsByDeptAndSem, deleteSubject } from '../utils/api';
import { MaterialIcons, AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SubjectManagementScreen = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For filtering
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  // For adding new subject
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    subjectCode: '',
    subjectName: '',
    department: 'CSE',
    semester: 1,
    credits: 3,
    description: ''
  });
  
  // For bulk add
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [currentBulkDept, setCurrentBulkDept] = useState('CSE');
  const [currentBulkSemester, setCurrentBulkSemester] = useState(1);
  
  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch filtered subjects when filters change
  useEffect(() => {
    if (filterDepartment && filterSemester) {
      fetchFilteredSubjects();
    } else if (!filterDepartment && !filterSemester) {
      fetchSubjects();
    }
  }, [filterDepartment, filterSemester]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await getAllSubjects();
      
      if (response.success) {
        setSubjects(response.subjects);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFilteredSubjects = async () => {
    if (!filterDepartment || !filterSemester) return;
    
    try {
      setLoading(true);
      const response = await getSubjectsByDeptAndSem(filterDepartment, filterSemester);
      
      if (response.success) {
        setSubjects(response.subjects);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch filtered subjects');
      }
    } catch (error) {
      console.error('Error fetching filtered subjects:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (filterDepartment && filterSemester) {
      fetchFilteredSubjects();
    } else {
      fetchSubjects();
    }
  };

  const resetFilters = () => {
    setFilterDepartment('');
    setFilterSemester('');
    fetchSubjects();
  };

  const handleAddSubject = async () => {
    // Validate form
    if (!newSubject.subjectCode || !newSubject.subjectName) {
      Alert.alert('Error', 'Subject code and name are required');
      return;
    }

    try {
      setLoading(true);
      const response = await addNewSubject(newSubject);
      
      if (response.success) {
        Alert.alert('Success', 'Subject added successfully');
        setShowAddModal(false);
        setNewSubject({
          subjectCode: '',
          subjectName: '',
          department: 'CSE',
          semester: 1,
          credits: 3,
          description: ''
        });
        
        // Refresh the list
        if (filterDepartment && filterSemester) {
          fetchFilteredSubjects();
        } else {
          fetchSubjects();
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = () => {
    // Initialize a new subject for bulk add
    const newBulkSubject = {
      subjectCode: '',
      subjectName: '',
      department: currentBulkDept,
      semester: currentBulkSemester,
      credits: 3
    };
    
    setBulkSubjects([...bulkSubjects, newBulkSubject]);
  };
  
  const updateBulkSubject = (index, field, value) => {
    const updatedSubjects = [...bulkSubjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: field === 'credits' ? Number(value) : value
    };
    setBulkSubjects(updatedSubjects);
  };
  
  const removeBulkSubject = (index) => {
    const updatedSubjects = [...bulkSubjects];
    updatedSubjects.splice(index, 1);
    setBulkSubjects(updatedSubjects);
  };
  
  const submitBulkSubjects = async () => {
    // Validate all subjects have code and name
    const invalidSubjects = bulkSubjects.filter(s => !s.subjectCode || !s.subjectName);
    if (invalidSubjects.length > 0) {
      Alert.alert('Error', 'All subjects must have a code and name');
      return;
    }
    
    try {
      setLoading(true);
      
      // Update department and semester for all subjects
      const preparedSubjects = bulkSubjects.map(s => ({
        ...s,
        department: currentBulkDept,
        semester: currentBulkSemester
      }));
      
      const response = await addNewSubject(preparedSubjects);
      
      if (response.success) {
        const { results } = response;
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        Alert.alert(
          'Bulk Add Complete', 
          `${successCount} subjects added successfully. ${failCount} failed.`
        );
        
        setShowBulkAddModal(false);
        setBulkSubjects([]);
        
        // Refresh the list
        if (filterDepartment === currentBulkDept && filterSemester == currentBulkSemester) {
          fetchFilteredSubjects();
        } else {
          fetchSubjects();
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to add subjects');
      }
    } catch (error) {
      console.error('Error in bulk add:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSubject = async (id, subjectName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${subjectName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await deleteSubject(id);
              
              if (response.success) {
                Alert.alert('Success', 'Subject deleted successfully');
                
                // Refresh the list
                if (filterDepartment && filterSemester) {
                  fetchFilteredSubjects();
                } else {
                  fetchSubjects();
                }
              } else {
                Alert.alert('Error', response.error || 'Failed to delete subject');
              }
            } catch (error) {
              console.error('Error deleting subject:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter(subject => 
    subject.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
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
        <View style={styles.header}>
         <TouchableOpacity 
                     onPress={() => router.back()} 
                     style={styles.backButton}
                     hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                   >
                     <Ionicons name="arrow-back" size={24} color="#6C63FF" />
                   </TouchableOpacity>
          <Text style={styles.title}>Subject Management</Text>
          <TouchableOpacity 
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          >
            <AntDesign name="plus" size={22} color="#4a6baf" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Department:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterDepartment}
                onValueChange={setFilterDepartment}
                style={styles.picker}
                dropdownIconColor="#4a6baf"
                mode="dropdown"
              >
                <Picker.Item label="All Departments" value="" />
                {departments.map(dept => (
                  <Picker.Item key={dept} label={dept} value={dept} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Semester:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterSemester}
                onValueChange={setFilterSemester}
                style={styles.picker}
                dropdownIconColor="#4a6baf"
                mode="dropdown"
                enabled={!!filterDepartment}
              >
                <Picker.Item label="All Semesters" value="" />
                {semesters.map(sem => (
                  <Picker.Item key={sem} label={`Semester ${sem}`} value={sem} />
                ))}
              </Picker>
            </View>
          </View>
          
          {(filterDepartment || filterSemester) && (
            <TouchableOpacity 
              onPress={resetFilters}
              style={styles.resetButton}
            >
              <MaterialIcons name="filter-list-off" size={18} color="#fff" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
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

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.bulkAddButton}
            onPress={() => setShowBulkAddModal(true)}
          >
            <MaterialIcons name="playlist-add" size={20} color="#4a6baf" />
            <Text style={styles.bulkAddText}>Bulk Add</Text>
          </TouchableOpacity>
          
          <Text style={styles.subjectCount}>
            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} found
          </Text>
        </View>

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
          {filteredSubjects.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="school" size={50} color="#ddd" />
              <Text style={styles.noResultsText}>No subjects found</Text>
              {(searchQuery || filterDepartment || filterSemester) ? (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    resetFilters();
                  }}
                  style={styles.clearFiltersButton}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => setShowAddModal(true)}
                  style={styles.addFirstButton}
                >
                  <Text style={styles.addFirstText}>Add your first subject</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredSubjects.map((subject, index) => (
              <View key={subject._id} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <View style={styles.codeContainer}>
                    <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
                  </View>
                  <View style={styles.deptSemContainer}>
                    <Text style={styles.deptSemText}>
                      {subject.department} • Semester {subject.semester}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteSubject(subject._id, subject.subjectName)}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons name="delete-outline" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.subjectName}>{subject.subjectName}</Text>
                
                <View style={styles.subjectFooter}>
                  <View style={styles.creditsContainer}>
                    <MaterialIcons name="stars" size={16} color="#f39c12" />
                    <Text style={styles.creditsText}>{subject.credits} Credits</Text>
                  </View>
                  
                  {subject.description ? (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {subject.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Add Subject Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject Code*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., CS101"
                  value={newSubject.subjectCode}
                  onChangeText={(text) => setNewSubject({...newSubject, subjectCode: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject Name*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Introduction to Programming"
                  value={newSubject.subjectName}
                  onChangeText={(text) => setNewSubject({...newSubject, subjectName: text})}
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.inputLabel}>Department*</Text>
                  <View style={styles.pickerContainerModal}>
                    <Picker
                      selectedValue={newSubject.department}
                      onValueChange={(value) => setNewSubject({...newSubject, department: value})}
                      style={styles.picker}
                      dropdownIconColor="#4a6baf"
                      mode="dropdown"
                    >
                      {departments.map(dept => (
                        <Picker.Item key={dept} label={dept} value={dept} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.inputLabel}>Semester*</Text>
                  <View style={styles.pickerContainerModal}>
                    <Picker
                      selectedValue={newSubject.semester}
                      onValueChange={(value) => setNewSubject({...newSubject, semester: value})}
                      style={styles.picker}
                      dropdownIconColor="#4a6baf"
                      mode="dropdown"
                    >
                      {semesters.map(sem => (
                        <Picker.Item key={sem} label={`Sem ${sem}`} value={sem} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Credits</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 3"
                  keyboardType="numeric"
                  value={newSubject.credits.toString()}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setNewSubject({...newSubject, credits: text ? parseInt(text) : ''})
                    }
                  }}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Optional subject description"
                  multiline
                  numberOfLines={3}
                  value={newSubject.description}
                  onChangeText={(text) => setNewSubject({...newSubject, description: text})}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Button 
                title={loading ? "Adding..." : "Add Subject"}
                onPress={handleAddSubject}
                disabled={loading}
                style={styles.submitButton}
                icon={loading ? null : "save"}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Bulk Add Modal */}
      <Modal
        visible={showBulkAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Add Subjects</Text>
              <TouchableOpacity onPress={() => setShowBulkAddModal(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bulkMetaContainer}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.inputLabel}>Department</Text>
                  <View style={styles.pickerContainerModal}>
                    <Picker
                      selectedValue={currentBulkDept}
                      onValueChange={setCurrentBulkDept}
                      style={styles.picker}
                      dropdownIconColor="#4a6baf"
                      mode="dropdown"
                    >
                      {departments.map(dept => (
                        <Picker.Item key={dept} label={dept} value={dept} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.inputLabel}>Semester</Text>
                  <View style={styles.pickerContainerModal}>
                    <Picker
                      selectedValue={currentBulkSemester}
                      onValueChange={setCurrentBulkSemester}
                      style={styles.picker}
                      dropdownIconColor="#4a6baf"
                      mode="dropdown"
                    >
                      {semesters.map(sem => (
                        <Picker.Item key={sem} label={`Sem ${sem}`} value={sem} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.addMoreButton}
                onPress={handleBulkAdd}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4a6baf" />
                <Text style={styles.addMoreText}>Add Subject</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.bulkSubjectsList}>
              {bulkSubjects.map((subject, index) => (
                <View key={index} style={styles.bulkSubjectItem}>
                  <View style={styles.bulkSubjectHeader}>
                    <Text style={styles.bulkSubjectIndex}>#{index + 1}</Text>
                    <TouchableOpacity 
                      style={styles.removeBulkButton}
                      onPress={() => removeBulkSubject(index)}
                    >
                      <Feather name="x" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject Code*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., CS101"
                      value={subject.subjectCode}
                      onChangeText={(text) => updateBulkSubject(index, 'subjectCode', text)}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject Name*</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Introduction to Programming"
                      value={subject.subjectName}
                      onChangeText={(text) => updateBulkSubject(index, 'subjectName', text)}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Credits</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 3"
                      keyboardType="numeric"
                      value={subject.credits.toString()}
                      onChangeText={(text) => {
                        if (/^\d*$/.test(text)) {
                          updateBulkSubject(index, 'credits', text ? parseInt(text) : '')
                        }
                      }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel"
                onPress={() => {
                  setShowBulkAddModal(false);
                  setBulkSubjects([]);
                }}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Button 
                title={loading ? "Processing..." : "Submit All"}
                onPress={submitBulkSubjects}
                disabled={loading || bulkSubjects.length === 0}
                style={styles.submitButton}
                icon={loading ? null : "send"}
              />
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
    paddingHorizontal: 5,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  addButton: {
    padding: 5,
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  filterSection: {
    flex: 1,
    marginRight: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 59,
    width: '100%',
    color: '#4a6baf',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6baf',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  resetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    margin: 15,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  bulkAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  bulkAddText: {
    color: '#4a6baf',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  subjectCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 10,
  },
  clearFiltersButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#4a6baf',
    fontSize: 14,
    fontWeight: '500',
  },
  addFirstButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#4a6baf',
    borderRadius: 8,
  },
  addFirstText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeContainer: {
    backgroundColor: '#4a6baf',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  subjectCode: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deptSemContainer: {
    flex: 1,
    marginLeft: 10,
  },
  deptSemText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  deleteButton: {
    padding: 5,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subjectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: '#95a5a6',
    marginLeft: 10,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalScroll: {
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainerModal: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#4a6baf',
    flex: 1,
  },
  bulkMetaContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginTop: 10,
  },
  addMoreText: {
    color: '#4a6baf',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  bulkSubjectsList: {
    marginBottom: 15,
  },
  bulkSubjectItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  bulkSubjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulkSubjectIndex: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  removeBulkButton: {
    padding: 5,
  },
});

export default SubjectManagementScreen;