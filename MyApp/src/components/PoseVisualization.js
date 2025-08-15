import React from 'react';
import HumanPose from 'react-native-human-pose';
import { View, Text, StyleSheet, Button, Dimensions, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { CameraIcon } from 'react-native-heroicons/outline';

const { width, height } = Dimensions.get('window');

const PoseVisualization = ({
  onPoseDetected,
  repCount,
  feedback,
  isCorrectPose,
  isCompleted,
  totalReps = 5,
  resetExercise,
  overlayOpacity,
  instructionsText,
  onFlipCamera,
  isBackCamera,
  isTimedExercise = false, // Nueva prop para diferenciar ejercicios de tiempo vs repeticiones
}) => {
  const [showInstructions, setShowInstructions] = React.useState(true);

  return (
    <View style={styles.container}>
      {/* Instrucciones iniciales */}
      {showInstructions && !isCompleted ? (
        <View style={styles.instructionsContainer}>
          <ScrollView>
            <Text style={styles.instructionsTitle}>Instrucciones</Text>
            <Text style={styles.instructionsText}>{instructionsText}</Text>
          </ScrollView>
          <Button
            title="Entendido, comenzar ejercicio"
            onPress={() => setShowInstructions(false)}
            color="#2196F3"
          />
        </View>
      ) : !isCompleted ? (
        <View style={styles.cameraContainer}>
          {/* HumanPose con un color fijo/neutral */}
          <HumanPose
            height={height * 0.2}
            width={width * 0.97}
            enableKeyPoints={true}
            flipHorizontal={false}
            isBackCamera={isBackCamera}
            color="0, 150, 255" // Color fijo - azul neutro
            onPoseDetected={onPoseDetected}
          />

          {/* Botón para cambiar la cámara */}
          <TouchableOpacity
            style={styles.flipCameraButton}
            onPress={onFlipCamera}
          >
            <CameraIcon size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        // Si está completado, mostrar un espacio para el resumen
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>¡Ejercicio Completado!</Text>
          <Text style={styles.completionSubtitle}>
            {isTimedExercise ? `Tiempo: ${repCount}/${totalReps}` : `Repeticiones: ${repCount}/${totalReps}`}
          </Text>
        </View>
      )}

      {/* Overlay para indicar correcto/incorrecto sin redibujar HumanPose */}
      {!isCompleted && !showInstructions && (
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: isCorrectPose ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
              opacity: overlayOpacity
            }
          ]}
        />
      )}

      <View style={styles.overlayContainer}>
        {!isCompleted && !showInstructions && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {isTimedExercise ? `Tiempo: ${repCount}/${totalReps}` : `Repeticiones: ${repCount}/${totalReps}`}
            </Text>
          </View>
        )}

        {!showInstructions && (
          <View style={[
            styles.feedbackContainer,
            {
              backgroundColor: isCompleted
                ? 'rgba(25, 118, 210, 0.9)'
                : (isCorrectPose ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)'),
              maxHeight: isCompleted ? height * 0.5 : 'auto'
            }
          ]}>
            {isCompleted ? (
              <ScrollView>
                <Text style={styles.instructionsTitle}>Resumen del Ejercicio</Text>
                <Text style={styles.instructionsText}>{feedback}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.feedbackText}>{feedback}</Text>
            )}
          </View>
        )}

        {isCompleted && (
          <View style={styles.buttonContainer}>
            <Button
              title="Reintentar Ejercicio"
              onPress={resetExercise}
              color="#4CAF50"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cameraContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  counterContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  counterText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryContainer: {
    padding: 10,
    alignItems: 'center',
    height: '100%',
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryText: {
    lineHeight: 24,
    fontSize: 17,
    textAlign: 'left',
  },
  buttonContainer: {
    marginBottom: 20,
    width: '80%',
  },
  completionContainer: {
    height: height * 0.2,
    width: width * 0.97,
    backgroundColor: 'rgba(66, 66, 66, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  completionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completionSubtitle: {
    color: 'white',
    fontSize: 18,
  },
  instructionsContainer: {
    height: height * 0.8,
    width: width * 0.97,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-between',
    margin: 'auto'
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  flipCameraButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
    zIndex: 3,
  },
});

export default PoseVisualization;