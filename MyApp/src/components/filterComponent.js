import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckIcon } from 'react-native-heroicons/solid';

const FilterComponent = ({ title, options, selectedOption, setSelectedOption }) => {
  const handleOptionPress = (option) => {
    // Si el usuario presiona una opción seleccionada, se elimina la selección
    if (selectedOption === option) {
      setSelectedOption(null); // Deseleccionar la opción
    } else {
      setSelectedOption(option); // Seleccionar la nueva opción
    }
  };

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              selectedOption === option && styles.selectedOption
            ]}
            onPress={() => handleOptionPress(option)}
          >
            {selectedOption === option && (
              <View style={styles.checkIconContainer}>
                <CheckIcon size={14} color="#FFFFFF" />
              </View>
            )}
            <Text 
              style={[
                styles.optionText, 
                selectedOption === option && styles.selectedOptionText
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  checkIconContainer: {
    marginRight: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default FilterComponent;