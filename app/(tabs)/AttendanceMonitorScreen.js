import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAttendanceReport, getFacultySubjects } from '../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 600;

const AttendanceMonitoringScreen = () => {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [period, setPeriod] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await getFacultySubjects();
        if (response.success) {
          setAvailableSubjects(response.subjects);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load subjects');
      }
    };

    fetchSubjects();
  }, []);

  // Fetch report when filters change
  useEffect(() => {
    if (selectedSubject && period) {
      fetchReport();
    }
  }, [date, selectedSubject, period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await getAttendanceReport({
        date: date.toISOString().split('T')[0],
        subjectCode: selectedSubject.subjectCode,
        period: period
      });
      
      if (response.success) {
        setReport(response.attendance[0]); // Get first matching record
      } else {
        setReport(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance report');
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handlePeriodSelect = (selectedPeriod) => {
    setPeriod(selectedPeriod);
    setShowPeriodModal(false);
  };

  const renderAbsentStudent = ({ item }) => (
    <View style={styles.absentStudent}>
      <View style={styles.studentAvatar}>
        <Ionicons name="person-circle-outline" size={36} color="#4a6baf" />
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.studentDetails}>{item.registerNumber}</Text>
      </View>
      <View style={styles.absentBadge}>
        <Feather name="x" size={16} color="#fff" />
        <Text style={styles.absentBadgeText}>Absent</Text>
      </View>
    </View>
  );

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        selectedSubject?.subjectCode === item.subjectCode && styles.selectedSubjectItem
      ]}
      onPress={() => {
        setSelectedSubject(item);
        setShowSubjectModal(false);
      }}
    >
      <View style={styles.subjectIcon}>
        <MaterialIcons name="book" size={24} color="#4a6baf" />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectCode}>{item.subjectCode}</Text>
        <Text style={styles.subjectDetails}>
          {item.department} • Sem {item.semester}
        </Text>
      </View>
      {selectedSubject?.subjectCode === item.subjectCode && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#4a6baf" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPeriodButton = (periodNumber) => (
    <TouchableOpacity
      key={periodNumber}
      style={[
        styles.periodButton,
        period === periodNumber && styles.selectedPeriodButton
      ]}
      onPress={() => handlePeriodSelect(periodNumber)}
    >
      <Text style={[
        styles.periodButtonText,
        period === periodNumber && styles.selectedPeriodButtonText
      ]}>
        Period {periodNumber}
      </Text>
      {period === periodNumber && (
        <Ionicons name="checkmark" size={20} color="#fff" style={styles.periodCheckIcon} />
      )}
    </TouchableOpacity>
  );

  const FilterPill = ({ icon, label, onPress, active }) => (
    <TouchableOpacity 
      style={[styles.filterPill, active && styles.activeFilterPill]}
      onPress={onPress}
    >
      <MaterialIcons 
        name={icon} 
        size={18} 
        color={active ? '#fff' : '#4a6baf'} 
      />
      <Text style={[styles.filterPillText, active && styles.activeFilterPillText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance Report</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Current Filters Display */}
        {(selectedSubject || period) && (
          <View style={styles.currentFiltersContainer}>
            <Text style={styles.currentFiltersTitle}>Current Selection:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.currentFiltersScroll}
            >
              <FilterPill
                icon="date-range"
                label={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                onPress={() => setShowDatePicker(true)}
                active={true}
              />
              
              {selectedSubject && (
                <FilterPill
                  icon="book"
                  label={selectedSubject.name}
                  onPress={() => setShowSubjectModal(true)}
                  active={true}
                />
              )}
              
              {period && (
                <FilterPill
                  icon="schedule"
                  label={`Period ${period}`}
                  onPress={() => setShowPeriodModal(true)}
                  active={true}
                />
              )}
            </ScrollView>
          </View>
        )}

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Select Filters</Text>
          <View style={styles.filtersContainer}>
            <TouchableOpacity 
              style={styles.filterCard}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="date-range" size={24} color="#4a6baf" />
              <Text style={styles.filterCardText}>Select Date</Text>
              <Text style={styles.filterCardValue}>
                {date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.filterCard}
              onPress={() => setShowSubjectModal(true)}
            >
              <MaterialIcons name="book" size={24} color="#4a6baf" />
              <Text style={styles.filterCardText}>Select Subject</Text>
              <Text style={styles.filterCardValue} numberOfLines={1}>
                {selectedSubject ? selectedSubject.name : 'Not selected'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.filterCard}
              onPress={() => setShowPeriodModal(true)}
            >
              <MaterialIcons name="schedule" size={24} color="#4a6baf" />
              <Text style={styles.filterCardText}>Select Period</Text>
              <Text style={styles.filterCardValue}>
                {period ? `Period ${period}` : 'Not selected'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            maximumDate={new Date()}
            themeVariant="light"
          />
        )}

        {/* Report Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6baf" />
            <Text style={styles.loadingText}>Loading report...</Text>
          </View>
        ) : report ? (
          <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
              <View style={styles.reportHeaderContent}>
                <Text style={styles.reportTitle}>
                  {report.subjectName}
                </Text>
                <Text style={styles.reportSubtitle}>
                  Period {report.period} • {new Date(report.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={styles.absentCount}>
                <Text style={styles.absentCountText}>{report.absentStudents.length}</Text>
                <Text style={styles.absentCountLabel}>Absent</Text>
              </View>
            </View>

            <FlatList
              data={report.absentStudents}
              keyExtractor={(item) => item.registerNumber}
              renderItem={renderAbsentStudent}
              contentContainerStyle={report.absentStudents.length === 0 && styles.emptyListContainer}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Ionicons name="checkmark-done-circle" size={48} color="#4CAF50" />
                  <Text style={styles.emptyText}>All students present</Text>
                  <Text style={styles.emptySubtext}>Great job! No absentees for this class.</Text>
                </View>
              }
              ListHeaderComponent={
                report.absentStudents.length > 0 && (
                  <Text style={styles.listHeader}>Absent Students</Text>
                )
              }
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialIcons name="error-outline" size={isTablet ? 60 : 50} color="#95a5a6" />
            <Text style={styles.noDataText}>No attendance data found</Text>
            <Text style={styles.noDataSubtext}>
              {selectedSubject && period 
                ? `for ${selectedSubject.name}, Period ${period} on ${date.toLocaleDateString()}`
                : 'Please select date, subject and period to view attendance'}
            </Text>
            {(selectedSubject || period) && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchReport}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Subject Selection Modal */}
        <Modal
          visible={showSubjectModal}
          animationType="slide"
          transparent={false}
          statusBarTranslucent={true}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Subject</Text>
                <TouchableOpacity 
                  onPress={() => setShowSubjectModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={availableSubjects}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderSubjectItem}
                contentContainerStyle={styles.subjectList}
                ListEmptyComponent={
                  <View style={styles.emptySubjects}>
                    <MaterialIcons name="book" size={48} color="#95a5a6" />
                    <Text style={styles.emptySubjectsText}>No subjects available</Text>
                  </View>
                }
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* Period Selection Modal */}
        <Modal
          visible={showPeriodModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowPeriodModal(false)}
        >
          <View style={styles.periodModalContainer}>
            <View style={styles.periodModalContent}>
              <Text style={styles.periodModalTitle}>Select Period</Text>
              <View style={styles.periodButtonsContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(renderPeriodButton)}
              </View>
              <TouchableOpacity 
                style={styles.periodModalCloseButton}
                onPress={() => setShowPeriodModal(false)}
              >
                <Text style={styles.periodModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4a6baf',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4a6baf',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRight: {
    width: 24,
  },
  currentFiltersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f4ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ff',
  },
  currentFiltersTitle: {
    fontSize: isTablet ? 15 : 13,
    color: '#4a6baf',
    marginBottom: 8,
    fontWeight: '500',
  },
  currentFiltersScroll: {
    paddingRight: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d6e0ff',
  },
  activeFilterPill: {
    backgroundColor: '#4a6baf',
    borderColor: '#4a6baf',
  },
  filterPillText: {
    marginLeft: 6,
    fontSize: isTablet ? 14 : 12,
    color: '#4a6baf',
    fontWeight: '500',
  },
  activeFilterPillText: {
    color: '#fff',
  },
  filtersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filtersContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  filterCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: isTablet ? 0 : 12,
    marginRight: isTablet ? 12 : 0,
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterCardText: {
    fontSize: isTablet ? 15 : 13,
    color: '#6c757d',
    marginTop: 8,
  },
  filterCardValue: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4a6baf',
    fontWeight: '500',
  },
  reportContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  reportHeaderContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: isTablet ? 15 : 13,
    color: '#6c757d',
  },
  absentCount: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff4f4',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  absentCountText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  absentCountLabel: {
    fontSize: isTablet ? 12 : 10,
    color: '#dc3545',
    marginTop: -4,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#495057',
    backgroundColor: '#f8f9fa',
  },
  absentStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  studentAvatar: {
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: isTablet ? 14 : 12,
    color: '#6c757d',
  },
  absentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  absentBadgeText: {
    fontSize: isTablet ? 12 : 10,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: isTablet ? 18 : 16,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: isTablet ? 14 : 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: isTablet ? 20 : 18,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: isTablet ? 15 : 13,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a6baf',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 8,
  },
  subjectList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedSubjectItem: {
    borderWidth: 1,
    borderColor: '#4a6baf',
    backgroundColor: '#f0f4ff',
  },
  subjectIcon: {
    backgroundColor: '#e9f0ff',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: isTablet ? 14 : 12,
    color: '#4a6baf',
    fontWeight: '500',
    marginBottom: 4,
  },
  subjectDetails: {
    fontSize: isTablet ? 13 : 11,
    color: '#6c757d',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  emptySubjects: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptySubjectsText: {
    fontSize: isTablet ? 18 : 16,
    color: '#6c757d',
    marginTop: 16,
  },
  periodModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  periodModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: isTablet ? '60%' : '90%',
    maxWidth: 400,
  },
  periodModalTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  periodButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  periodButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#4a6baf',
  },
  periodButtonText: {
    fontSize: isTablet ? 16 : 14,
    color: '#4a6baf',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  periodCheckIcon: {
    position: 'absolute',
    right: 10,
  },
  periodModalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  periodModalCloseButtonText: {
    fontSize: isTablet ? 16 : 14,
    color: '#4a6baf',
    fontWeight: '500',
  },
});

export default AttendanceMonitoringScreen;