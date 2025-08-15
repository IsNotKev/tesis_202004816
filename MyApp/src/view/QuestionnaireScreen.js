import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  StatusBar,
  Modal,
  Dimensions
} from 'react-native';
import {
  ClockIcon,
  BoltIcon,
  BeakerIcon,
  ChartBarIcon,
  CubeIcon,
  HomeIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  XCircleIcon
} from 'react-native-heroicons/solid';

import generateAdvancedRoutine from '../model/RoutineGenerator';

import {timeOptions, focusOptions, muscleOptions, levelOptions, equipmentOptions} from '../data/optionsData';

// Obtenemos el ancho de la pantalla para calcular tamaños
const screenWidth = Dimensions.get('window').width;

// Información detallada sobre el equipamiento
const equipmentDetails = {
  'Sin equipo': 'Ejercicios que solo requieren el peso de tu cuerpo: flexiones, sentadillas, planchas, etc.',
  'Equipo básico': 'Incluye: silla, banco, botella con agua como peso, toalla, escaleras, y ejercicios sin equipo.',
  'Equipo completo': 'Incluye todo tipo de equipamiento: mancuernas, barras, bandas elásticas, máquinas de gimnasio, etc.'
};

const RoutineQuestionnaire = ({ navigation }) => {

  const [selections, setSelections] = useState({
    time: null,
    focus: null,
    muscle: null,
    level: null,
    equipment: null
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentInfo, setCurrentInfo] = useState('');
  const [currentEquipmentTitle, setCurrentEquipmentTitle] = useState('');

  // Función para mostrar información del equipamiento
  const showEquipmentInfo = (equipmentType, event) => {
    event.stopPropagation();
    setCurrentEquipmentTitle(equipmentType);
    setCurrentInfo(equipmentDetails[equipmentType]);
    setShowInfoModal(true);
  };

  // Función para renderizar opciones normales distribuyendo todo el ancho disponible
  const renderOptionsRow = (options, category) => {
    const optionsCount = Object.keys(options).length;
    
    return (
      <View style={styles.optionsRowFullWidth}>
        {Object.keys(options).map((option, index) => {
          const isSelected = selections[category] === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.rowOptionFullWidth,
                isSelected ? styles.selectedHorizontal : null,
                index === optionsCount - 1 ? { marginRight: 0 } : null
              ]}
              onPress={() => {
                if (category === 'focus' && (option === 'Resistencia' || option === 'Mixto')) {
                  setSelections(prev => ({
                    ...prev,
                    [category]: option,
                    muscle: 'Todo'
                  }));
                } else {
                  setSelections(prev => ({ ...prev, [category]: option }));
                }
              }}
            >
              <Text style={[
                styles.optionText,
                isSelected ? styles.selectedText : null
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Función para renderizar opciones de equipamiento con mejor diseño
  const renderEquipmentOptions = () => {
    return (
      <View style={styles.equipmentOptionsGrid}>
        {Object.keys(equipmentOptions).map((option) => {
          const isSelected = selections.equipment === option;
          return (
            <View key={option} style={styles.equipmentItemContainer}>
              <TouchableOpacity
                style={[
                  styles.equipmentOption,
                  isSelected ? styles.selectedHorizontal : null
                ]}
                onPress={() => {
                  setSelections(prev => ({ ...prev, equipment: option }));
                }}
              >
                <Text style={[
                  styles.equipmentText,
                  isSelected ? styles.selectedText : null
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={(e) => showEquipmentInfo(option, e)}
                activeOpacity={0.8}
              >
                <View style={styles.infoIconContainer}>
                  <InformationCircleIcon size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  // Validate all selections are made
  const generateRoutine = () => {
    const allSelected = Object.values(selections).every(value => value !== null);

    if (!allSelected) {
      Alert.alert('Error', 'Por favor, selecciona todas las opciones');
      return;
    }

    // Convert selections to numeric values
    const routineParams = {
      time: timeOptions[selections.time],
      focus: focusOptions[selections.focus],
      muscleGroup: muscleOptions[selections.muscle],
      level: levelOptions[selections.level],
      equipment: equipmentOptions[selections.equipment]
    };

    const routine = generateAdvancedRoutine(routineParams);
    navigation.navigate('Routine', { routine: routine });
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A66A0" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CREA TU RUTINA</Text>
        <Text style={styles.headerSubtitle}>Personaliza tu entrenamiento</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
              <ClockIcon size={22} color="#FF8A3D" />
            </View>
            <Text style={styles.question}>Duración</Text>
          </View>
          <View style={styles.optionsContainer}>
            {renderOptionsRow(timeOptions, 'time')}
          </View>
        </View>

        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
              <BoltIcon size={22} color="#FF8A3D" />
            </View>
            <Text style={styles.question}>Enfoque</Text>
          </View>
          <View style={styles.optionsContainer}>
            {renderOptionsRow(focusOptions, 'focus')}
          </View>
        </View>

        {selections.focus === 'Fuerza' && (
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
                <BeakerIcon size={22} color="#FF8A3D" />
              </View>
              <Text style={styles.question}>Grupo Muscular</Text>
            </View>
            <View style={styles.optionsContainer}>
              {renderOptionsRow(muscleOptions, 'muscle')}
            </View>
          </View>
        )}
        {(selections.focus === 'Resistencia' || selections.focus === 'Mixto') && (
          <View style={styles.autoSelectedCard}>
            <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
              <BeakerIcon size={22} color="#FF8A3D" />
            </View>
            <Text style={styles.autoSelectedText}>Grupo Muscular: Todo el cuerpo</Text>
          </View>
        )}

        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
              <ChartBarIcon size={22} color="#FF8A3D" />
            </View>
            <Text style={styles.question}>Nivel</Text>
          </View>
          <View style={styles.optionsContainer}>
            {renderOptionsRow(levelOptions, 'level')}
          </View>
        </View>

        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.iconBadge, {backgroundColor: '#FFF3E0'}]}>
              <CubeIcon size={22} color="#FF8A3D" />
            </View>
            <Text style={styles.question}>Equipamiento</Text>
          </View>
          <View style={styles.optionsContainer}>
            {renderEquipmentOptions()}
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateRoutine}
        >
          <Text style={styles.generateButtonText}>GENERAR RUTINA</Text>
          <ArrowRightIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Inicio')}
        >
          <HomeIcon size={20} color="#4A66A0" />
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de información */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showInfoModal}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentEquipmentTitle}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowInfoModal(false)}
              >
                <XCircleIcon size={26} color="#FF8A3D" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>{currentInfo}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#4A66A0',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D4E5FF',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  // Estilo para ícono con fondo
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  optionsContainer: {
    marginBottom: 8,
    width: '100%',
  },
  // NUEVO: Opciones en fila horizontal que ocupan todo el ancho disponible
  optionsRowFullWidth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
  },
  rowOptionFullWidth: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    height: 46,
    marginRight: 8,
  },
  // Estilos originales para opciones en fila horizontal (mantenidos por compatibilidad)
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingRight: 10,
  },
  rowOption: {
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    minWidth: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    height: 46,
  },
  selectedHorizontal: {
    backgroundColor: '#4A66A0',
    borderColor: '#4A66A0',
  },
  optionText: {
    color: '#505A68',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 15,
  },
  selectedText: {
    color: 'white',
  },
  // Grid para opciones de equipamiento (sin cambios)
  equipmentOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  equipmentItemContainer: {
    width: '31%',
    position: 'relative',
    marginBottom: 22,
  },
  equipmentOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    height: 64, // Aumentado para más espacio
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  equipmentText: {
    color: '#505A68',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 13, // Reducido para mejor ajuste
  },
  // Botón de información
  infoButton: {
    position: 'absolute',
    top: -8,
    right: -6,
    zIndex: 10,
    width: 24,
    height: 24,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A66A0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  autoSelectedCard: {
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0EDDF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  autoSelectedText: {
    fontSize: 16,
    color: '#4a67a0',
    fontWeight: '600',
    marginLeft: 12,
  },
  generateButton: {
    backgroundColor: '#FF8A3D',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 30,
  },
  homeButtonText: {
    color: '#4A66A0',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F2',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0CC',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8A3D',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 22,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  }
});

export default RoutineQuestionnaire;