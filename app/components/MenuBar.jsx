import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { removeAuthToken } from '../utils/auth';
import { getFacultyProfile } from '../utils/api';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.75;

export default function MenuBar() {
  const router = useRouter();
  const currentPath = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [facultyData, setFacultyData] = useState(null);
  const sidebarX = useRef(new Animated.Value(-sidebarWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const response = await getFacultyProfile();
        if (response.success) {
          setFacultyData(response.faculty);
        }
      } catch (error) {
        console.error('Error fetching faculty data:', error);
      }
    };
    
    fetchFacultyData();
  }, []);

  const toggleSidebar = () => {
    const toValue = isVisible ? -sidebarWidth : 0;
    const opacityValue = isVisible ? 0 : 0.3;
    
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue,
        useNativeDriver: true,
        bounciness: 0
      }),
      Animated.timing(overlayOpacity, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      if (isVisible) setIsVisible(false);
    });
    
    if (!isVisible) setIsVisible(true);
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue: -sidebarWidth,
        useNativeDriver: true,
        bounciness: 0
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => setIsVisible(false));
  };

  const handleLogout = async () => {
    await removeAuthToken();
    router.replace('/(auth)/LoginScreen');
  };

  const menuItems = [
    { 
      title: 'Dashboard', 
      icon: 'grid-outline', 
      route: '/(tabs)',
    },
    { 
      title: 'Attendance', 
      icon: 'calendar-outline', 
      route: '/(tabs)/AttendanceScreen',
    },
    { 
      title: 'Student Details', 
      icon: 'people-outline', 
      route: '/(tabs)/StudentDetailsScreen',
    },
    { 
      title: 'Add Student', 
      icon: 'person-add-outline', 
      route: '/(tabs)/AddStudent',
    },
    { 
      title: 'Attendance Log', 
      icon: 'list-outline', 
      route: '/(tabs)/AttendanceMonitorScreen',
    },
    { 
      title: 'Add Marks', 
      icon: 'create-outline', 
      route: '/(tabs)/AddMarkScreen',
    },
    {
      title: 'Subject Handling',
      icon: 'book-outline',
      route: '/(tabs)/SubjectManagement',
    },
    { 
      title: 'Faculty Profile', 
      icon: 'person-outline', 
      route: '/(tabs)/FacultyProfileScreen',
    },
    { 
      title: 'Settings', 
      icon: 'settings-outline', 
      route: '/(tabs)/FacultyProfileScreen',
    },
  ];

  const handleNavigation = (route) => {
    closeSidebar();
    router.push(route);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={toggleSidebar}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isVisible ? "close-outline" : "menu-outline"} 
          size={28} 
          color="#4a6baf"
        />
      </TouchableOpacity>

      {isVisible && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View 
            style={[
              styles.overlay, 
              { opacity: overlayOpacity }
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View 
        style={[
          styles.sidebar, 
          { 
            transform: [{ translateX: sidebarX }],
            width: sidebarWidth
          }
        ]}
      >
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image
              source={{ uri: facultyData?.image || 'https://i.imgur.com/3xqp9yB.jpg' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {facultyData?.name || 'Faculty Name'}
              </Text>
              <Text style={styles.profileTitle} numberOfLines={1}>
                {facultyData?.department || 'Department'}
              </Text>
              <Text style={styles.profileId}>
                ID: {facultyData?.facultyId || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView 
            style={styles.menuItems}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => {
              const isActive = currentPath === item.route;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    isActive && styles.activeMenuItem
                  ]}
                  onPress={() => handleNavigation(item.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={isActive ? "#4a6baf" : "#5f6f7d"} 
                  />
                  <Text 
                    style={[
                      styles.menuText,
                      isActive && styles.activeMenuText
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 13,
    left: 8,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 5,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 60,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 13,
    color: '#6c757d',
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  activeMenuItem: {
    backgroundColor: '#f1f7ff',
  },
  menuText: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 15,
    flex: 1,
  },
  activeMenuText: {
    color: '#4a6baf',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
    marginLeft: 15,
  },
});