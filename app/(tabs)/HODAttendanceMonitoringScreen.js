import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
  Image,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { MaterialIcons, Ionicons, Feather, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFullDayAbsentees } from '../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const HODAttendanceMonitoringScreen = () => {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState(false);

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchData();
  }, [date, selectedDepartment, selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const absenteesRes = await getFullDayAbsentees({
        date: date.toISOString().split('T')[0],
        department: selectedDepartment,
        semester: selectedSemester
      });
      
      if (absenteesRes.success) {
        setAbsentees(absenteesRes.absentees);
      } else {
        Alert.alert('Error', absenteesRes.message || 'Failed to fetch absentees');
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedSemester(null);
  };

  const renderAbsenteeItem = ({ item, index }) => {
    // Generate a consistent avatar background color based on name
    const colorSeeds = ['#6C63FF', '#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];
    const colorIndex = item.name.length % colorSeeds.length;
    const avatarColor = colorSeeds[colorIndex];
    
    // Get initials for avatar
    const initials = item.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return (
      <Animatable.View 
        animation="fadeInUp"
        duration={800}
        delay={index * 50}
        style={styles.absenteeCard}
      >
        <View style={styles.absenteeContent}>
          <View style={[styles.absenteeAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          
          <View style={styles.absenteeDetails}>
            <View style={styles.absenteeNameRow}>
              <Text style={styles.absenteeName}>{item.name}</Text>
              <View style={styles.absenteeDateContainer}>
                <Feather name="calendar" size={14} color="#718096" />
                <Text style={styles.absenteeDateText}>
                  {new Date(item.absentDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
            
            <Text style={styles.absenteeId}>{item.registerNumber}</Text>
            
            <View style={styles.absenteeMeta}>
              <View style={[styles.deptBadge, { backgroundColor: `${avatarColor}20` }]}>
                <Text style={[styles.deptBadgeText, { color: avatarColor }]}>{item.department}</Text>
              </View>
              <View style={[styles.semBadge, { backgroundColor: `${avatarColor}20` }]}>
                <Text style={[styles.semBadgeText, { color: avatarColor }]}>Sem {item.semester}</Text>
              </View>
              
            </View>
          </View>
        </View>
        
        
      </Animatable.View>
    );
  };

  const FilterPill = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterPill, active && styles.filterPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
        {label}
      </Text>
      {active && (
        <View style={styles.activeIndicator}>
          <AntDesign name="check" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
     
      
      {/* Header */}
      <LinearGradient
        colors={['#6C63FF', '#8A7EFF']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      > 
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Attendance Monitor</Text>
          
          <TouchableOpacity 
            style={styles.helpButton}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        }
      >
        {/* Date Selector Card */}
        <Animatable.View 
          animation="fadeIn"
          duration={500}
          style={styles.dateCard}
        >
          <View style={styles.dateCardHeader}>
            <Text style={styles.dateCardTitle}>Select Date</Text>
            <TouchableOpacity 
              onPress={() => setDate(new Date())}
              style={styles.todayButton}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconContainer}>
              <MaterialIcons name="date-range" size={22} color="#6C63FF" />
            </View>
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <MaterialIcons 
              name="keyboard-arrow-down" 
              size={22} 
              color="#6C63FF" 
              style={styles.dateArrow} 
            />
          </TouchableOpacity>
        </Animatable.View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

        {/* Filters Card */}
        <Animatable.View 
          animation="fadeIn"
          duration={500}
          delay={100}
          style={styles.filtersCard}
        >
          <View style={styles.filtersCardHeader}>
            <Text style={styles.filtersCardTitle}>
              Filters
              {(selectedDepartment || selectedSemester) && (
                <Text style={styles.activeFiltersText}> • Active</Text>
              )}
            </Text>
            
            {(selectedDepartment || selectedSemester) && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
                <Feather name="x" size={16} color="#6C63FF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.expandFiltersButton}
              onPress={() => setExpandedFilters(!expandedFilters)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandFiltersText}>
                {expandedFilters ? 'Collapse' : 'Expand'}
              </Text>
              <MaterialIcons 
                name={expandedFilters ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={20} 
                color="#6C63FF" 
              />
            </TouchableOpacity>
          </View>
          
          {expandedFilters && (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Department</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterContainer}
                >
                  {departments.map(dept => (
                    <FilterPill
                      key={dept}
                      label={dept}
                      active={selectedDepartment === dept}
                      onPress={() => setSelectedDepartment(
                        selectedDepartment === dept ? null : dept
                      )}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Semester</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterContainer}
                >
                  {semesters.map(sem => (
                    <FilterPill
                      key={sem}
                      label={`Sem ${sem}`}
                      active={selectedSemester === sem}
                      onPress={() => setSelectedSemester(
                        selectedSemester === sem ? null : sem
                      )}
                    />
                  ))}
                </ScrollView>
              </View>
            </>
          )}
          
          {!expandedFilters && (
            <View style={styles.collapsedFiltersView}>
              <View style={styles.collapsedFilterRow}>
                <Text style={styles.collapsedFilterLabel}>Department:</Text>
                <Text style={styles.collapsedFilterValue}>
                  {selectedDepartment || 'All Departments'}
                </Text>
              </View>
              <View style={styles.collapsedFilterRow}>
                <Text style={styles.collapsedFilterLabel}>Semester:</Text>
                <Text style={styles.collapsedFilterValue}>
                  {selectedSemester ? `Semester ${selectedSemester}` : 'All Semesters'}
                </Text>
              </View>
            </View>
          )}
        </Animatable.View>

        {/* Absentees Section */}
        <Animatable.View 
          animation="fadeIn"
          duration={500}
          delay={200}
          style={styles.absenteesSection}
        >
          <View style={styles.absenteesSectionHeader}>
            <View style={styles.absenteesTitleContainer}>
              <Text style={styles.absenteesTitle}>Absent Students</Text>
              <View style={styles.absenteeCountBadge}>
                <Text style={styles.absenteeCountText}>{absentees.length}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
              <Text style={styles.sortButtonText}>Sort</Text>
              <MaterialIcons name="sort" size={18} color="#6C63FF" />
            </TouchableOpacity>
          </View>

          {absentees.length > 0 ? (
            <FlatList
              data={absentees}
              renderItem={renderAbsenteeItem}
              keyExtractor={item => item.registerNumber}
              scrollEnabled={false}
              contentContainerStyle={styles.absenteeList}
              numColumns={width > 500 ? 2 : 1}
              columnWrapperStyle={width > 500 ? { justifyContent: 'space-between' } : null}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={require('../../assets/clg_logo.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>No Absentees Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedDepartment || selectedSemester 
                  ? 'No students absent with current filters' 
                  : 'Great! All students present today.'}
              </Text>
              
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshButtonText}>Refresh Data</Text>
                <Feather name="refresh-cw" size={16} color="#fff" style={styles.refreshIcon} />
              </TouchableOpacity>
            </View>
          )}
        </Animatable.View>
        
        {/* Analytics Summary */}
        {absentees.length > 0 && (
          <Animatable.View 
            animation="fadeIn"
            duration={500}
            delay={300}
            style={styles.analyticsCard}
          >
            <Text style={styles.analyticsTitle}>Quick Analytics</Text>
            
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>
                  {departments.filter(d => 
                    absentees.some(a => a.department === d)
                  ).length}/{departments.length}
                </Text>
                <Text style={styles.analyticsLabel}>Depts with Absences</Text>
              </View>
              
              <View style={styles.analyticsDivider} />
              
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>
                  {Math.round(absentees.reduce((sum, a) => sum + a.absentPeriods.length, 0) / absentees.length)}
                </Text>
                <Text style={styles.analyticsLabel}>Avg. Periods Missed</Text>
              </View>
              
              <View style={styles.analyticsDivider} />
              
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>
                  {absentees.length > 0 
                    ? Math.max(...semesters.map(s => 
                        absentees.filter(a => a.semester === s).length
                      ))
                    : 0}
                </Text>
                <Text style={styles.analyticsLabel}>Highest in a Sem</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.viewReportButton}
              activeOpacity={0.7}
            >
              <Text style={styles.viewReportText}>View Full Report</Text>
              <Feather name="arrow-right" size={16} color="#6C63FF" />
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <Animatable.View
        animation="fadeInUp"
        duration={500}
        style={styles.fab}
      >
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => router.replace('StudentDetailsScreen')}
        >
          <LinearGradient
            colors={['#6C63FF', '#8A7EFF']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="send" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
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
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingImage: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
    opacity: 0.8,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    width: (width - 48) / 3.15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  statTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    fontFamily: 'Inter-SemiBold',
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
  },
  todayButtonText: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Inter-Medium',
  },
  dateArrow: {
    marginLeft: 'auto',
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  filtersCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  activeFiltersText: {
    color: '#6C63FF',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
    marginRight: 8,
  },
  clearFiltersText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
    fontFamily: 'Inter-Medium',
  },
  expandFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
  },
  expandFiltersText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
    fontFamily: 'Inter-Medium',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  filterPillText: {
    color: '#718096',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  filterPillTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  activeIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  collapsedFiltersView: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
  },
  collapsedFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collapsedFilterLabel: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
    width: 100,
    fontFamily: 'Inter-Medium',
  },
  collapsedFilterValue: {
    color: '#2d3748',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  absenteesSection: {
    marginBottom: 16,
  },
  absenteesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  absenteesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  absenteesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    fontFamily: 'Inter-Bold',
  },
  absenteeCountBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  absenteeCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
  },
  sortButtonText: {
    color: '#6C63FF',
    fontWeight: '500',
    fontSize: 14,
    marginRight: 4,
    fontFamily: 'Inter-Medium',
  },
  absenteeList: {
    paddingBottom: 8,
  },
  absenteeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: width > 500 ? (width - 48) / 2 - 8 : undefined,
    marginBottom: 16,
  },
  absenteeContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  absenteeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  absenteeDetails: {
    flex: 1,
  },
  absenteeNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  absenteeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  absenteeId: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  absenteeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  deptBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  semBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  semBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  absenteeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  absenteeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  absenteeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  absenteeDateText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  absenteeFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f7fafc',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
    marginRight: 8,
  },
  actionButtonText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyImage: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Inter-SemiBold',
  },
  refreshIcon: {
    transform: [{ rotate: '90deg' }],
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4a5568',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  analyticsDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f7fafc',
    marginTop: 6,
  },
  viewReportText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Inter-SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HODAttendanceMonitoringScreen;