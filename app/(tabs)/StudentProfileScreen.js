import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Image,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { deleteStudent, getStudentByRegisterNumber } from '../utils/api';

const StudentProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { registerNumber } = route.params;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudentByRegisterNumber(registerNumber);
      
      if (response.success) {
        setStudent(response.student);
      } else {
        setError(response.error || 'Failed to fetch student data');
        Alert.alert('Error', response.error || 'Failed to fetch student data');
      }
    } catch (err) {
      setError(err.message || 'Network error');
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [registerNumber]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentData();
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${student.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await deleteStudent(registerNumber);
              if (response.success) {
                Alert.alert("Success", "Student deleted successfully");
                navigation.goBack();
              } else {
                Alert.alert("Error", response.error || "Failed to delete student");
              }
            } catch (error) {
              Alert.alert("Error", error.message || "Network error");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditStudentScreen', { student });
  };

  const handleCall = (number) => {
    if (number) {
      Linking.openURL(`tel:${number}`);
    } else {
      Alert.alert('No number', 'Phone number not available');
    }
  };

  const handleEmail = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert('No email', 'Email address not available');
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    const { street, city, state, pincode, country } = address;
    return `${street}, ${city}, ${state} - ${pincode}, ${country}`;
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.tableHeaderCell, { flex: 2 }]}>
        <Text style={styles.tableHeaderText}>Subject</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>CAT-1</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>CAT-2</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Model</Text>
      </View>
    </View>
  );

  const renderTableRow = (subjectCode) => {
    const subjectData = student.marks[subjectCode];
    
    if (!subjectData) return null;

    return (
      <View style={styles.tableRow} key={subjectCode}>
        <View style={[styles.tableCell, { flex: 2 }]}>
          <Text style={styles.subjectCodeText}>{subjectCode}</Text>
          <Text style={styles.subjectNameText} numberOfLines={1}>{subjectData.subjectName}</Text>
        </View>
        <View style={styles.tableCell}>
          <Text style={styles.markText}>{subjectData.cat1 ?? '-'}</Text>
        </View>
        <View style={styles.tableCell}>
          <Text style={styles.markText}>{subjectData.cat2 ?? '-'}</Text>
        </View>
        <View style={styles.tableCell}>
          <Text style={styles.markText}>{subjectData.modelExam ?? '-'}</Text>
        </View>
      </View>
    );
  };

  if (loading && !student) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b7bec" />
        <Text style={styles.loadingText}>Loading student data...</Text>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#eb3b5a" />
        <Text style={styles.errorText}>Student data not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchStudentData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4b7bec']}
            tintColor="#4b7bec"
          />
        }
      >
        {/* Header with back button and actions */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4b7bec" />
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://www.gravatar.com/avatar/?d=identicon' }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.nameText}>{student.name}</Text>
          <Text style={styles.idText}>ID: {student.registerNumber}</Text>
          
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>
              {student.department} • Sem {student.semester}
            </Text>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{student.department}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Semester</Text>
              <Text style={styles.infoValue}>{student.semester}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Roll No</Text>
              <Text style={styles.infoValue}>{student.rollNo || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Classroom</Text>
              <Text style={styles.infoValue}>{student.classroom || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Academic Performance Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Academic Performance</Text>
          
          {student.marks && Object.keys(student.marks).length > 0 ? (
            <View style={styles.tableContainer}>
              {renderTableHeader()}
              {Object.keys(student.marks).map(renderTableRow)}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="error-outline" size={24} color="#a5b1c2" />
              <Text style={styles.noDataText}>No marks data available</Text>
            </View>
          )}
        </View>

        {/* Attendance Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          
          {student.attendance ? (
            <View style={styles.attendanceContainer}>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Total Days</Text>
                <Text style={styles.attendanceValue}>{student.attendance.totalDays || 0}</Text>
              </View>
              
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Present</Text>
                <Text style={styles.attendanceValue}>{student.attendance.present || 0}</Text>
              </View>
              
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Absent</Text>
                <Text style={styles.attendanceValue}>{student.attendance.absent || 0}</Text>
              </View>
              
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Percentage</Text>
                <Text style={[
                  styles.attendanceValue,
                  { 
                    color: student.attendance.totalDays > 0 && 
                          (student.attendance.present / student.attendance.totalDays * 100) < 75 
                      ? '#eb3b5a' : '#26de81'
                  }
                ]}>
                  {student.attendance.totalDays > 0 
                    ? `${(student.attendance.present / student.attendance.totalDays * 100).toFixed(1)}%`
                    : '0%'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="error-outline" size={24} color="#a5b1c2" />
              <Text style={styles.noDataText}>No attendance data available</Text>
            </View>
          )}
        </View>

        {/* Contact Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#4b7bec" style={styles.contactIcon} />
            <TouchableOpacity onPress={() => handleEmail(student.email)}>
              <Text style={[styles.contactText, styles.linkText]}>
                {student.email || 'N/A'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#4b7bec" style={styles.contactIcon} />
            <TouchableOpacity onPress={() => handleCall(student.parentsNumber)}>
              <Text style={[styles.contactText, styles.linkText]}>
                {student.parentsNumber || 'N/A'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {student.guardianContacts && student.guardianContacts[0] && (
            <>
              <View style={styles.contactItem}>
                <Ionicons name="people-outline" size={20} color="#4b7bec" style={styles.contactIcon} />
                <Text style={styles.contactText}>
                  {student.guardianContacts[0].relation}: {student.guardianContacts[0].name}
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color="#4b7bec" style={styles.contactIcon} />
                <TouchableOpacity onPress={() => handleCall(student.guardianContacts[0].phone)}>
                  <Text style={[styles.contactText, styles.linkText]}>
                    {student.guardianContacts[0].phone || 'N/A'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={20} color="#4b7bec" style={styles.contactIcon} />
            <Text style={styles.contactText} numberOfLines={3}>
              {student.address ? formatAddress(student.address) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Remarks Section */}
        {student.remarks && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <Text style={styles.remarksText}>{student.remarks}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  container: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b7bec',
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#eb3b5a',
    marginTop: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4b7bec',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 123, 236, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4b7bec',
  },
  deleteButton: {
    backgroundColor: '#eb3b5a',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  idText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  departmentBadge: {
    backgroundColor: '#e0e6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  departmentText: {
    fontSize: 14,
    color: '#4b7bec',
    fontFamily: 'Inter-SemiBold',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2d3436',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  infoValue: {
    fontSize: 16,
    color: '#2d3436',
    fontFamily: 'Inter-SemiBold',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: 'black',
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 24,
  },
  linkText: {
    color: 'black',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f2f6',
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  tableHeaderCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    color: '#2d3436',
    fontFamily: 'Inter-SemiBold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
    backgroundColor: 'white',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  subjectCodeText: {
    fontSize: 14,
    color: '#636e72',
    fontFamily: 'Inter-Medium',
  },
  subjectNameText: {
    fontSize: 15,
    color: '#2d3436',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  markText: {
    fontSize: 16,
    color: '#2d3436',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  attendanceContainer: {
    marginTop: 8,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  attendanceLabel: {
    fontSize: 16,
    color: '#636e72',
    fontFamily: 'Inter-Medium',
  },
  attendanceValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
  },
  remarksText: {
    fontSize: 16,
    color: '#2d3436',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
});

export default StudentProfileScreen;