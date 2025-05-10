import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  Dimensions,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  getFacultySubjects, 
  getClassroomStudents, 
  markAttendance, 
  getPeriodStatus,
  sendAbsenteeNotification,
  getAttendanceReport,
  getAbsenteesWithParents,
  getPeriodAttendance
} from '../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const AttendanceMarkingScreen = () => {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [period, setPeriod] = useState(1);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [periodStatus, setPeriodStatus] = useState({});
  const [allPeriodsMarked, setAllPeriodsMarked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [previousAttendance, setPreviousAttendance] = useState([]);
  const [isViewingPastAttendance, setIsViewingPastAttendance] = useState(false);
  const [highestMarkedPeriod, setHighestMarkedPeriod] = useState(0);
  
  // Notification modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [absentStudentsForNotification, setAbsentStudentsForNotification] = useState([]);
  const [selectedAbsentees, setSelectedAbsentees] = useState([]);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  // Fetch faculty subjects
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch students and period status when subject or date changes
  useEffect(() => {
    if (selectedSubject) {
      setPeriod(1); // Reset to period 1 when subject changes
      fetchStudents();
      fetchPeriodStatus();
      fetchPreviousAttendance();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject) {
      fetchPeriodStatus();
      fetchPreviousAttendance();
    }
  }, [date]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFacultySubjects();
      
      if (response.success && response.subjects.length > 0) {
        setAvailableSubjects(response.subjects);
        if (response.subjects.length === 1) {
          setSelectedSubject(response.subjects[0]);
        }
      } else {
        setError("No subjects assigned to you");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setFetchingStudents(true);
      setError(null);
      
      // Ensure we have a selected subject with all required properties
      if (!selectedSubject || !selectedSubject.subjectCode || !selectedSubject.name || 
          !selectedSubject.department || !selectedSubject.semester) {
        setError("Invalid subject selection");
        console.error("Invalid subject data:", selectedSubject);
        return;
      }
      
      
    
      const response = await getClassroomStudents({
        subjectCode: selectedSubject.subjectCode,
        name: selectedSubject.name,
        department: selectedSubject.department,
        semester: selectedSubject.semester
      });
    
      if (response.success) {
        const studentsWithStatus = response.students.map(student => ({
          ...student,
          status: 'present'
        }));
        setStudents(studentsWithStatus);
      } else {
        setError(response.error || "Failed to fetch students");
        console.error("API returned error:", response);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(error.message || "Failed to fetch students");
    } finally {
      setFetchingStudents(false);
    }
  };
  

  const fetchPeriodStatus = async () => {
    if (!selectedSubject) return;
    
    try {
      const response = await getPeriodStatus({
        date: date.toISOString().split('T')[0],
        department: selectedSubject.department,
        semester: selectedSubject.semester
      });
      
      if (response.success) {
        setPeriodStatus(response.periodStatus);
        setAllPeriodsMarked(response.allPeriodsMarked);
        
        // Calculate the highest marked period
        let highest = 0;
        Object.entries(response.periodStatus).forEach(([p, status]) => {
          const periodNum = parseInt(p);
          if (status.marked && periodNum > highest) {
            highest = periodNum;
          }
        });
        setHighestMarkedPeriod(highest);
        
        // Find the first unmarked period
        const unmarkedPeriod = Object.entries(response.periodStatus)
          .find(([p, status]) => !status.marked);
        
        // Set to first unmarked period or period 1 if all are marked
        setPeriod(unmarkedPeriod ? parseInt(unmarkedPeriod[0]) : 1);
      }
    } catch (error) {
      console.error("Error fetching period status:", error);
    }
  };

  const fetchPreviousAttendance = async () => {
    if (!selectedSubject) return;
    
    try {
      const response = await getAttendanceReport({
        date: date.toISOString().split('T')[0],
        department: selectedSubject.department,
        semester: selectedSubject.semester,
        subjectCode: selectedSubject.subjectCode
      });
      
      if (response.success) {
        setPreviousAttendance(response.attendance);
      }
    } catch (error) {
      console.error("Error fetching previous attendance:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSubjects(),
      selectedSubject && fetchStudents(),
      selectedSubject && fetchPeriodStatus(),
      selectedSubject && fetchPreviousAttendance()
    ]);
    setRefreshing(false);
  };

  const toggleStudentStatus = (registerNumber, status) => {
    if (isViewingPastAttendance) return; // Disable editing for past attendance
    
    setStudents(prev => prev.map(student => 
      student.registerNumber === registerNumber
        ? { ...student, status }
        : student
    ));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const absentStudents = students
        .filter(student => student.status === 'absent')
        .map(student => ({
          registerNumber: student.registerNumber,
          name: student.name
        }));
  
      // Get the department from the selected subject or from students
      const department = selectedSubject.department || 
                        (students.length > 0 ? students[0].department : null);
                        
      if (!department) {
        throw new Error("Department information is missing");
      }
  
      // Include all required fields in the attendance data
      const attendanceData = {
        subjectCode: selectedSubject.subjectCode,
        subjectName: selectedSubject.name,  // Include subject name explicitly
        period,
        date: date.toISOString().split('T')[0],
        semester: selectedSubject.semester,
        department: department,  // Include department explicitly
        absentStudents
      };
  

  
      // First save the attendance
      const response = await markAttendance(attendanceData);
  
      if (response.success) {
        // Update period status and previous attendance
        await Promise.all([
          fetchPeriodStatus(),
          fetchPreviousAttendance()
        ]);
        
        // If there are absent students, show notification modal
        if (absentStudents.length > 0) {
          // Get absent students with parents numbers
          const absenteesResponse = await getAbsenteesWithParents({
            date: date.toISOString().split('T')[0],
            period,
            subjectCode: selectedSubject.subjectCode,
            semester: selectedSubject.semester
          });
          
          if (absenteesResponse.success) {
            setAbsentStudentsForNotification(absenteesResponse.absentStudents);
            setSelectedAbsentees(absenteesResponse.absentStudents.map(s => s.registerNumber));
            setShowNotificationModal(true);
          } else {
            Alert.alert(
              'Attendance Saved', 
              'Attendance marked successfully but could not load absentees for notification',
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Success', 
            'Attendance marked successfully with no absentees',
            [{ text: 'OK' }]
          );
        }
        
        // Reset all students to present for next period
        setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setError(error.message || 'Failed to submit attendance');
      Alert.alert(
        'Error',
        `Failed to submit attendance: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNotifications = async () => {
    try {
      setSendingNotifications(true);
      
      const studentsToNotify = absentStudentsForNotification.filter(
        student => selectedAbsentees.includes(student.registerNumber)
      );
      
      const response = await sendAbsenteeNotification(
        studentsToNotify,
        selectedSubject.name,
        date.toISOString().split('T')[0],
        period
      );
      
      if (response.success) {
        Alert.alert(
          'Notifications Sent',
          `Successfully sent ${response.successful} notifications. ${response.failed} failed.`,
          [{ text: 'OK', onPress: () => setShowNotificationModal(false) }]
        );
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to send some notifications',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send notifications',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingNotifications(false);
    }
  };

  const toggleAbsenteeSelection = (registerNumber) => {
    setSelectedAbsentees(prev => 
      prev.includes(registerNumber)
        ? prev.filter(rn => rn !== registerNumber)
        : [...prev, registerNumber]
    );
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsViewingPastAttendance(false); // Reset viewing state when date changes
    }
  };

  const handlePeriodSelect = async (periodNum) => {
    const status = periodStatus[periodNum] || {};
    
    if (status.marked) {
      // If period is already marked, load that attendance data
      try {
        setFetchingStudents(true);
        const response = await getPeriodAttendance({
          date: date.toISOString().split('T')[0],
          period: periodNum,
          department: selectedSubject.department,
          semester: selectedSubject.semester
        });
        
        if (response.success) {
          setStudents(response.attendance.students);
          setPeriod(periodNum);
          setIsViewingPastAttendance(true);
        } else {
          setError(response.error || "Failed to load attendance");
        }
      } catch (error) {
        console.error("Error loading attendance:", error);
        setError("Failed to load attendance data");
      } finally {
        setFetchingStudents(false);
      }
    } else {
      // For unmarked periods, reset to default present status
      await fetchStudents();
      setIsViewingPastAttendance(false);
      setPeriod(periodNum);
    }
  };

  const loadAttendanceForPeriod = async (periodNum) => {
    try {
      setFetchingStudents(true);
      
      // Find the attendance record for this period
      const attendanceRecord = previousAttendance.find(a => a.period === periodNum);
      
      if (attendanceRecord) {
        // Get all students for the subject
        const response = await getClassroomStudents(selectedSubject.name);
        
        if (response.success) {
          // Map students with their attendance status
          const studentsWithStatus = response.students.map(student => {
            const isAbsent = attendanceRecord.absentStudents.some(
              absent => absent.registerNumber === student.registerNumber
            );
            return {
              ...student,
              status: isAbsent ? 'absent' : 'present'
            };
          });
          
          setStudents(studentsWithStatus);
          setPeriod(periodNum);
        }
      } else {
        // If no attendance record found (shouldn't happen since button was marked)
        setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      setError("Failed to load attendance data");
    } finally {
      setFetchingStudents(false);
    }
  };

  const renderPeriodButton = (periodNum) => {
    const status = periodStatus[periodNum] || {};
    const isCurrent = period === periodNum;
    
    // Disable periods that are more than 1 above the highest marked period
    const isDisabled = periodNum > highestMarkedPeriod + 1;
  
    let backgroundColor = '#e9ecef';
    let borderColor = 'transparent';
    let textColor = '#6c757d';
  
    if (isCurrent) {
      backgroundColor = '#6C63FF';
      textColor = '#fff';
    } else if (status.marked) {
      backgroundColor = status.markedByFaculty ? '#e2f0ff' : '#f0f0f0';
      borderColor = status.markedByFaculty ? '#6C63FF' : '#cccccc';
      textColor = status.markedByFaculty ? '#6C63FF' : '#999999';
    }
  
    if (allPeriodsMarked) {
      backgroundColor = '#e8f5e9';
      borderColor = '#4CAF50';
      textColor = '#4CAF50';
    }
  
    return (
      <TouchableOpacity
        key={periodNum}
        style={[
          styles.periodButton,
          { 
            backgroundColor,
            borderColor,
            borderWidth: borderColor !== 'transparent' ? 2 : 0,
            opacity: isDisabled ? 0.5 : 1
          }
        ]}
        onPress={() => !isDisabled && handlePeriodSelect(periodNum)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        {(status.marked || allPeriodsMarked) && (
          <View style={[styles.periodMarkedBadge, 
            allPeriodsMarked && { backgroundColor: '#4CAF50' }
          ]}>
            <FontAwesome name="check" size={12} color="#fff" />
          </View>
        )}
        {isDisabled && (
          <View style={styles.periodDisabledBadge}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
          </View>
        )}
        <Text style={[
          styles.periodButtonText,
          { color: textColor }
        ]}>
          {periodNum}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStudentItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeIn"
      duration={500}
      delay={index * 50}
      style={styles.studentRow}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.studentDetails}>
          {item.registerNumber} • Roll: {item.rollNo}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.status === 'present' && styles.activeStatusButton
          ]}
          onPress={() => toggleStudentStatus(item.registerNumber, 'present')}
          disabled={isViewingPastAttendance || allPeriodsMarked}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={28} 
            color={item.status === 'present' ? '#4CAF50' : '#e0e0e0'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.status === 'absent' && styles.activeStatusButton
          ]}
          onPress={() => toggleStudentStatus(item.registerNumber, 'absent')}
          disabled={isViewingPastAttendance || allPeriodsMarked}
        >
          <Ionicons 
            name="close-circle" 
            size={28} 
            color={item.status === 'absent' ? '#F44336' : '#e0e0e0'} 
          />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  const renderAbsenteeItem = ({ item }) => (
    <View style={styles.absenteeRow}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleAbsenteeSelection(item.registerNumber)}
      >
        <Ionicons
          name={selectedAbsentees.includes(item.registerNumber) ? "checkbox" : "square-outline"}
          size={24}
          color={selectedAbsentees.includes(item.registerNumber) ? '#6C63FF' : '#ccc'}
        />
      </TouchableOpacity>
      <View style={styles.absenteeInfo}>
        <Text style={styles.absenteeName}>{item.name}</Text>
        <Text style={styles.absenteeDetails}>
          {item.registerNumber} • {item.parentsNumber}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>
          {error || "Loading your subjects..."}
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !selectedSubject) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color="#6C63FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Error Message */}
        {error && (
          <Animatable.View 
            animation="fadeInDown"
            style={styles.errorBanner}
          >
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </Animatable.View>
        )}

        {/* Date Picker */}
        <TouchableOpacity 
          style={styles.datePicker}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="date-range" size={24} color="#6C63FF" />
          <Text style={styles.dateText}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </TouchableOpacity>

        {/* Subject Selection */}
        <TouchableOpacity 
          style={styles.subjectSelector}
          onPress={() => setShowSubjectModal(true)}
          disabled={availableSubjects.length === 0}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorLabel}>Subject</Text>
            <Text 
              style={[
                styles.subjectSelectorText,
                !selectedSubject && styles.placeholderText
              ]} 
              numberOfLines={1}
            >
              {selectedSubject 
                ? `${selectedSubject.name} (${selectedSubject.subjectCode})`
                : "Select Subject"}
            </Text>
          </View>
          <MaterialIcons 
            name="expand-more" 
            size={24} 
            color={availableSubjects.length === 0 ? '#ccc' : '#666'} 
          />
        </TouchableOpacity>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Period:</Text>
            {isViewingPastAttendance && (
              <Text style={styles.viewingText}>Viewing Past Attendance</Text>
            )}
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScroll}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(renderPeriodButton)}
          </ScrollView>
        </View>

        {allPeriodsMarked && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
            <Text style={styles.completedBannerText}>
              All periods marked for today
            </Text>
          </View>
        )}

        {/* Student List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            Student Name
          </Text>
          <View style={styles.statusHeader}>
            <Text style={styles.statusHeaderText}>Present</Text>
            <Text style={styles.statusHeaderText}>Absent</Text>
          </View>
        </View>

        {/* Student List */}
        {fetchingStudents ? (
          <View style={styles.loadingStudentsContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingStudentsText}>Loading students...</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item.registerNumber}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <MaterialIcons name="people-outline" size={50} color="#e0e0e0" />
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6C63FF']}
                tintColor="#6C63FF"
              />
            }
          />
        )}

        {/* Submit Button */}
        {!allPeriodsMarked && !isViewingPastAttendance && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedSubject || submitting || students.length === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedSubject || submitting || students.length === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {periodStatus[period]?.marked ? 'Update' : 'Submit'} Attendance
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Subject Selection Modal */}
        <Modal
          visible={showSubjectModal}
          animationType="slide"
          transparent={false}
          statusBarTranslucent={true}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity 
                onPress={() => setShowSubjectModal(false)}
                style={styles.modalCloseButton}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {availableSubjects.length > 0 ? (
              <FlatList
                data={availableSubjects}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.subjectItem}
                    onPress={() => {
                      setSelectedSubject(item);
                      setShowSubjectModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{item.name}</Text>
                      <Text style={styles.subjectCode}>{item.subjectCode}</Text>
                    </View>
                    <Text style={styles.subjectDetails}>
                      {item.department} - Sem {item.semester}
                    </Text>
                    <Text style={styles.periodsText}>
                      Periods: {item.periods?.join(', ')}
                    </Text>
                    {selectedSubject?.subjectCode === item.subjectCode && (
                      <Ionicons name="checkmark" size={24} color="#6C63FF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptySubjects}>
                <MaterialIcons name="book" size={48} color="#e0e0e0" />
                <Text style={styles.emptySubjectsText}>No subjects assigned</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        {/* Notification Modal */}
        <Modal
          visible={showNotificationModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <SafeAreaView style={styles.notificationModalContainer}>
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Notify Parents</Text>
              <TouchableOpacity 
                onPress={() => setShowNotificationModal(false)}
                style={styles.modalCloseButton}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationModalContent}>
              <View style={styles.notificationInfoCard}>
                <Ionicons name="information-circle" size={24} color="#6C63FF" />
                <Text style={styles.notificationInfoText}>
                  You can notify parents about their child's absence today
                </Text>
              </View>
              
              <Text style={styles.absenteeCountText}>
                {absentStudentsForNotification.length} absent students
              </Text>
              
              <FlatList
                data={absentStudentsForNotification}
                keyExtractor={item => item.registerNumber}
                renderItem={renderAbsenteeItem}
                contentContainerStyle={styles.absenteeListContent}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <MaterialIcons name="people-outline" size={50} color="#e0e0e0" />
                    <Text style={styles.emptyText}>No absent students</Text>
                  </View>
                }
              />
              
              <View style={styles.notificationActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowNotificationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Skip Notifications</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    selectedAbsentees.length === 0 && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendNotifications}
                  disabled={selectedAbsentees.length === 0 || sendingNotifications}
                >
                  {sendingNotifications ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      Send ({selectedAbsentees.length})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
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
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    marginTop: 16,
    color: '#FF6B6B',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Inter-SemiBold',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-Medium',
  },
  completedBannerText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#2c3e50',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Inter-SemiBold',
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  subjectSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  placeholderText: {
    color: '#9e9e9e',
  },
  periodContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2c3e50',
  },
  viewingText: {
    fontFamily: 'Inter-Medium',
    color: '#6C63FF',
    fontSize: 14,
  },
  periodScroll: {
    paddingVertical: 8,
  },
  periodButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginRight: 12,
    position: 'relative',
  },
  periodMarkedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#6C63FF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeaderText: {
    fontFamily: 'Inter-Bold',
    color: '#6C63FF',
    fontSize: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    width: 120,
    justifyContent: 'space-between',
  },
  statusHeaderText: {
    fontFamily: 'Inter-Bold',
    color: '#6C63FF',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
    marginRight: 16,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'Inter-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    width: 120,
    justifyContent: 'space-between',
  },
  statusButton: {
    padding: 8,
    borderRadius: 20,
  },
  activeStatusButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  loadingStudentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingStudentsText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#adb5bd',
    fontFamily: 'Inter-Medium',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowColor: '#adb5bd',
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#212529',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    color: '#6C63FF',
    fontFamily: 'Inter-SemiBold',
  },
  subjectDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 8,
    fontFamily: 'Inter-Regular',
  },
  periodsText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  emptySubjects: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptySubjectsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#adb5bd',
    fontFamily: 'Inter-Medium',
  },
  // Notification modal styles
  notificationModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  notificationModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2c3e50',
  },
  notificationModalContent: {
    flex: 1,
    paddingBottom: 20,
  },
  notificationInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  notificationInfoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  absenteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  checkbox: {
    marginRight: 16,
  },
  absenteeInfo: {
    flex: 1,
  },
  absenteeName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2c3e50',
  },
  absenteeDetails: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  absenteeCountText: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'Inter-Medium',
    marginLeft: 16,
    marginBottom: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontFamily: 'Inter-SemiBold',
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  sendButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  periodDisabledBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#6c757d',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AttendanceMarkingScreen;