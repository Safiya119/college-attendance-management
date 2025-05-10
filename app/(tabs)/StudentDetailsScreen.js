import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getStudents } from '../utils/api';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const StudentDetailsScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const semesters = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents();
      
      if (response.success) {
        setStudents(response.students);
        filterStudents(response.students, searchQuery, selectedDept, selectedSemester);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', error.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterStudents = (studentsData, query, dept, semester) => {
    let filtered = [...studentsData];
    
    if (query.trim() !== '') {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(lowercasedQuery) || 
        student.registerNumber.toLowerCase().includes(lowercasedQuery) ||
        (student.guardianContacts && student.guardianContacts.some(
          contact => contact.name.toLowerCase().includes(lowercasedQuery)
        )
      ));
    }
    
    if (dept !== 'All') {
      filtered = filtered.filter(student => student.department === dept);
    }
    
    if (semester !== 'All') {
      const semNumber = parseInt(semester, 10);
      filtered = filtered.filter(student => student.semester === semNumber);
    }
    
    setFilteredStudents(filtered);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents(students, searchQuery, selectedDept, selectedSemester);
  }, [searchQuery, selectedDept, selectedSemester, students]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const navigateToStudentProfile = (student) => {
    navigation.navigate('StudentProfileScreen', { 
      registerNumber: student.registerNumber
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    const { street, city, state, pincode, country } = address;
    return `${street}, ${city}, ${state} - ${pincode}, ${country}`;
  };

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => navigateToStudentProfile(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardRegisterNo}>{item.registerNumber}</Text>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={16} color="#6C63FF" />
            <Text style={styles.cardDetail}>{item.department} • Sem {item.semester}</Text>
          </View>
          
          {item.guardianContacts && item.guardianContacts[0] && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6C63FF" />
              <Text style={styles.cardDetail}>
                {item.guardianContacts[0].relation}: {item.guardianContacts[0].name}
              </Text>
            </View>
          )}
          
          {item.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6C63FF" />
              <Text style={styles.cardDetail} numberOfLines={1}>
                {formatAddress(item.address)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.classroomText}>{item.classroom}</Text>
          <Ionicons name="chevron-forward" size={20} color="#6C63FF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color="#6C63FF" />
          </TouchableOpacity>
          <Text style={styles.title}>Student Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.filterButton]}
              onPress={toggleFilters}
            >
              <Ionicons 
                name={showFilters ? "filter" : "filter-outline"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.addButton]}
              onPress={() => navigation.navigate('AddStudent')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6C63FF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID or guardian..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {showFilters && (
          <View style={styles.filterContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Department</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDept}
                  onValueChange={setSelectedDept}
                  style={styles.picker}
                  dropdownIconColor="#6C63FF"
                  mode="dropdown"
                >
                  {departments.map(dept => (
                    <Picker.Item 
                      key={dept} 
                      label={dept === 'All' ? 'All Departments' : dept} 
                      value={dept} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Semester</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSemester}
                  onValueChange={setSelectedSemester}
                  style={styles.picker}
                  dropdownIconColor="#6C63FF"
                  mode="dropdown"
                >
                  {semesters.map(sem => (
                    <Picker.Item 
                      key={sem} 
                      label={sem === 'All' ? 'All Semesters' : `Sem ${sem}`} 
                      value={sem} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {searchQuery !== '' || selectedDept !== 'All' || selectedSemester !== 'All' 
              ? `Showing ${filteredStudents.length} of ${students.length} students` 
              : `Total Students: ${students.length}`}
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading students...</Text>
          </View>
        ) : filteredStudents.length > 0 ? (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.registerNumber}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6C63FF']}
                tintColor="#6C63FF"
              />
            }
            contentContainerStyle={styles.listContent}
            renderItem={renderStudentItem}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery !== '' || selectedDept !== 'All' || selectedSemester !== 'All'
                ? "Try adjusting your search or filters"
                : "No students in the database yet"}
            </Text>
            {(searchQuery !== '' || selectedDept !== 'All' || selectedSemester !== 'All') && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedDept('All');
                  setSelectedSemester('All');
                }}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 1,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'left',
    marginRight:50
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    backgroundColor: '#10B981',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  resultsContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  listContent: {
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardRegisterNo: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardDetails: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDetail: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  classroomText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default StudentDetailsScreen;