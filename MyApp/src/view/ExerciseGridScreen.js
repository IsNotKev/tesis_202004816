import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, SafeAreaView, TextInput } from 'react-native';
import { 
  AdjustmentsHorizontalIcon, 
  MagnifyingGlassIcon,
  FireIcon, 
  XMarkIcon,
  HomeIcon
} from 'react-native-heroicons/solid';
import exerciseData from '../data/exerciseData';
import FilterComponent from '../components/filterComponent';

import { getTypes, getEquipment, getMuscleGroups } from '../model/DataModel';

const ExerciseGridScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtrar ejercicios basado en la selección del usuario y búsqueda
  const filteredExercises = exerciseData.filter((exercise) => {
    const matchesSearch = searchQuery === '' || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    return (
      matchesSearch &&
      (!selectedType || exercise.type === selectedType) &&
      (!selectedEquipment || exercise.equipment === selectedEquipment) &&
      (!selectedMuscleGroup || exercise.muscleGroup === selectedMuscleGroup)
    );
  });

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedEquipment(null);
    setSelectedMuscleGroup(null);
  };
  
  // Contar filtros activos
  const activeFiltersCount = [selectedType, selectedEquipment, selectedMuscleGroup]
    .filter(filter => filter !== null).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ejercicios</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <AdjustmentsHorizontalIcon size={24} color="#3b82f6" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <MagnifyingGlassIcon size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <XMarkIcon size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Mostrar filtros solo cuando se haga clic en el botón de filtro */}
      {showFilters && (
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtros</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
          
          <FilterComponent
            title="Tipo de Ejercicio"
            options={getTypes()}
            selectedOption={selectedType}
            setSelectedOption={setSelectedType}
          />
          <FilterComponent
            title="Equipo"
            options={getEquipment()}
            selectedOption={selectedEquipment}
            setSelectedOption={setSelectedEquipment}
          />
          <FilterComponent
            title="Grupo Muscular"
            options={getMuscleGroups()}
            selectedOption={selectedMuscleGroup}
            setSelectedOption={setSelectedMuscleGroup}
          />
        </View>
      )}

      {/* Resultados */}
      {filteredExercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No se encontraron ejercicios</Text>
          <Text style={styles.emptyStateSubtext}>Intenta con otros filtros</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.gridContainer}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.name}
                style={styles.gridItem}
                onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
              >
                <View style={styles.exerciseImageContainer}>
                  {exercise.image ? (
                    <Image source={exercise.image} style={styles.exerciseImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <FireIcon size={30} color="#FFF" />
                    </View>
                  )}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseType}>{exercise.muscleGroup}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      
      {/* Botón para regresar al HomeScreen */}
      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => navigation.navigate('Inicio')}
      >
        <HomeIcon size={24} color="#FFFFFF" />
        <Text style={styles.homeButtonText}>Inicio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: '#111827',
  },
  filtersWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearFiltersText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Espacio para evitar que el botón de inicio cubra el contenido
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseImageContainer: {
    height: 120,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    padding: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  homeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  homeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default ExerciseGridScreen;