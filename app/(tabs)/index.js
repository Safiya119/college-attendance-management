import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MenuBar from '../components/MenuBar';
import { getFacultyProfile, getFacultySubjects } from '../utils/api';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function HomeScreen() {
  const router = useRouter();
  const [faculty, setFaculty] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
    classes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const facultyRes = await getFacultyProfile();
        const subjectsRes = await getFacultySubjects();
        
        if (facultyRes.success) setFaculty(facultyRes.faculty);
        if (subjectsRes.success) {
          setSubjects(subjectsRes.subjects);
          setStats({
            subjects: subjectsRes.subjects.length || 0,
            students: facultyRes.faculty?.studentCount || 0,
            classes: facultyRes.faculty?.classCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const menuItems = [
    { 
      id: 1, 
      title: 'Attendance', 
      icon: 'calendar-clear-outline', 
      screen: '/(tabs)/AttendanceScreen',
      color: '#2563EB' // Royal Blue
    },
    { 
      id: 2, 
      title: 'Student Details', 
      icon: 'school-outline', 
      screen: '/(tabs)/StudentDetailsScreen',
      color: '#059669' // Emerald Green
    },
    { 
      id: 3, 
      title: 'Add Student', 
      icon: 'person-add-outline', 
      screen: '/(tabs)/AddStudent',
      color: '#F59E42' // Muted Amber
    },
    { 
      id: 4, 
      title: 'Attendance Log', 
      icon: 'document-text-outline', 
      screen: '/(tabs)/AttendanceMonitorScreen',
      color: '#7C3AED' // Violet
    },
    { 
      id: 5, 
      title: 'Add Marks', 
      icon: 'create-outline', 
      screen: '/(tabs)/AddMarkScreen',
      color: '#EA580C' // Deep Orange
    },
    {
      id: 6,
      title: 'Subject Handling',
      icon: 'book-outline',
      screen: '/(tabs)/SubjectManagement',
      color: '#0E7490' // Deep Cyan
    },
    {
      id: 7,
      title: 'Attendance Overview',
      icon: 'stats-chart-outline', 
      screen: '/(tabs)/HODAttendanceMonitoringScreen',
      color: '#64748B' // Slate Gray
    }
  ];
  
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MenuBar/>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.headerTitle}>Faculty Dashboard</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItemContainer, { backgroundColor: item.color }]}
              onPress={() => router.push(item.screen)}
            >
              <View style={styles.menuItem}>
                <Ionicons name={item.icon} size={isTablet ? 32 : 28} color="#fff" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Faculty Profile</Text>
          
          <TouchableOpacity 
            style={styles.profileCard}
            onPress={() => router.push('/(tabs)/FacultyProfileScreen')}
          >
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: faculty?.image || 'https://i.imgur.com/3xqp9yB.jpg' }}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{faculty?.name || 'Faculty Name'}</Text>
              <Text style={styles.profileDept}>Department of {faculty?.department || 'Your Department'}</Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.subjects}</Text>
                  <Text style={styles.statLabel}>Subjects</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>99+</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>(-)</Text>
                  <Text style={styles.statLabel}>Classes</Text>
                </View>
              </View>
            </View>
            <View style={styles.viewProfileButton}>
              <Ionicons name="chevron-forward" size={22} color="#6c757d" />
            </View>
          </TouchableOpacity>
        </View>

        
        {/* Upcoming Classes Section - replacing Recent Activity */}
        <View style={styles.upcomingSection}>
  <Text style={styles.sectionTitle}>Upcoming Classes</Text>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.classesList}
  >
    {subjects.length > 0 ? (
      subjects.map((subject, index) => (
        <View 
          key={subject.subjectCode} 
          style={[
            styles.classCard,
            { borderLeftColor: getSubjectColor(index) }
          ]}
        >
          <Text style={styles.classTime}>
            {subject.timing || '09:00 - 10:40 AM'} {/* Use actual timing from your data */}
          </Text>
          <Text style={styles.className}>
            {subject.subjectCode} - {subject.name}
          </Text>
          
          <View style={styles.classDetails}>
            <View style={styles.classDetail}>
              <Ionicons name="location-outline" size={16} color="#6c757d" />
              <Text style={styles.classDetailText}>
                {subject.classroom || 'Room 301'}
              </Text>
            </View>
            <View style={styles.classDetail}>
              <Ionicons name="people-outline" size={16} color="#6c757d" />
              <Text style={styles.classDetailText}>
                {subject.department || 'CSE-A'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.attendanceButton}
            onPress={() => router.push('/(tabs)/AttendanceScreen')}
          >
            <Text style={styles.attendanceButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
      ))
    ) : (
      <View style={styles.noSubjectsContainer}>
        <Text style={styles.noSubjectsText}>No upcoming classes scheduled</Text>
      </View>
    )}
  </ScrollView>
</View>
        
        {/* Subject Overview Section */}
        <View style={styles.subjectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upload Marks</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/AddMarkScreen')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {subjects.length > 0 ? (
            subjects.slice(0, 3).map((subject, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.subjectCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/AddMarkScreen',
                  params: { subjectCode: subject.subjectCode }
                })}
              >
                <View style={[styles.subjectIcon, { backgroundColor: getSubjectColor(index) }]}>
                  <Text style={styles.subjectIconText}>{subject.subjectCode.substring(0, 2)}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectSemester}>{subject.department} - Semester {subject.semester}</Text>
                </View>
                <View style={styles.subjectArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noSubjectsContainer}>
              <Text style={styles.noSubjectsText}>No subjects assigned yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Function to generate colors for subject cards
const getSubjectColor = (index) => {
  const colors = ['#4F91FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Base background - 60%
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    paddingTop: isTablet ? 70 : 60,
    paddingBottom: 15,
    paddingHorizontal: isTablet ? 30 : 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6c757d', // Secondary text - 30%
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: isTablet ? 30 : 26,
    fontWeight: 'bold',
    color: '#212529', // Primary text - 60%
  },
  scrollView: {
    flex: 1,
  },
  menuGrid: {
    padding: isTablet ? 20 : 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItemContainer: {
    width: isTablet ? '31%' : '48%',
    marginBottom: isTablet ? 20 : 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    width: '100%',
    height: isTablet ? 140 : 120,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    color: '#fff',
    marginTop: isTablet ? 16 : 12,
    fontWeight: '600',
    fontSize: isTablet ? 18 : 15,
    textAlign: 'center',
  },
  profileSection: {
    padding: isTablet ? 20 : 15,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    marginBottom: isTablet ? 20 : 15,
    color: '#212529',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isTablet ? 20 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  profileImageContainer: {
    width: isTablet ? 90 : 70,
    height: isTablet ? 90 : 70,
    borderRadius: isTablet ? 45 : 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    marginLeft: isTablet ? 20 : 15,
  },
  profileName: {
    fontSize: isTablet ? 20 : 17,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  profileDept: {
    fontSize: isTablet ? 16 : 14,
    color: '#6c757d',
    marginBottom: isTablet ? 15 : 10,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  statItem: {
    alignItems: 'center',
    marginRight: isTablet ? 20 : 15,
  },
  statNumber: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  statLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#6c757d',
  },
  viewProfileButton: {
    justifyContent: 'center',
    padding: 5,
  },
  
  // New Styles for Upcoming Classes Section
  upcomingSection: {
    padding: isTablet ? 20 : 15,
  },
  classesList: {
    paddingRight: isTablet ? 20 : 15,
    paddingBottom: 10,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isTablet ? 20 : 15,
    marginRight: 15,
    width: isTablet ? 360 : 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
  },
  classTime: {
    fontSize: isTablet ? 16 : 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  className: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  classDetails: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  classDetailText: {
    fontSize: isTablet ? 14 : 12,
    color: '#6c757d',
    marginLeft: 5,
  },
  attendanceButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  attendanceButtonText: {
    color: '#4F91FF',
    fontWeight: '600',
    fontSize: isTablet ? 14 : 12,
  },
  
  // Subject Overview Section
  subjectsSection: {
    padding: isTablet ? 20 : 15,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 15,
  },
  viewAllText: {
    color: '#4F91FF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isTablet ? 16 : 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subjectIcon: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  subjectIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isTablet ? 18 : 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subjectSemester: {
    fontSize: isTablet ? 14 : 12,
    color: '#6c757d',
  },
  subjectArrow: {
    padding: 5,
  },
  noSubjectsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  noSubjectsText: {
    color: '#6c757d',
    fontSize: isTablet ? 16 : 14,
  }
});