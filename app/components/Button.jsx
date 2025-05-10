import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  disabled, 
  icon, 
  iconColor = '#fff',
  iconSize = 20 
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {disabled ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={styles.icon} 
            />
          )}
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;