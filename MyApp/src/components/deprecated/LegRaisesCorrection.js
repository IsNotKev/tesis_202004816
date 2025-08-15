import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const LegRaisesCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [exercisePhase, setExercisePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer elevaciones de piernas');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    legAlignment: 0,
    hipFlexion: 0,
    backArching: 0,
    legHeight: 0,
    controlledMovement: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidHipAngle, setLastValidHipAngle] = useState(170);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de elevaciones de piernas, sigue estas instrucciones:\n\n" +
    "1. Acuéstate boca arriba sobre una superficie plana, con las piernas extendidas.\n\n" +
    "2. Coloca la cámara de lado para que pueda ver todo tu cuerpo de perfil.\n\n" +
    "3. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "4. Mantén los brazos a los costados del cuerpo o ligeramente separados.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para animar el overlay cuando cambia isCorrectPose
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isCorrectPose ? 0.3 : 0.5, // Mayor opacidad para indicaciones incorrectas
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Reset opacity after a short time
    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isCorrectPose]);

  const onPoseDetected = (poses) => {
    if (!poses || poses.length === 0) return;
    
    const pose = poses[0]?.pose;
    
    // Verificar que tenemos todos los keypoints necesarios con suficiente confianza
    const keypoints = [
      pose.leftHip, pose.rightHip, 
      pose.leftKnee, pose.rightKnee, 
      pose.leftAnkle, pose.rightAnkle,
      pose.leftShoulder, pose.rightShoulder
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA ELEVACIONES DE PIERNAS
    analyzeLegRaiseForm(pose);
  };

  const analyzeLegRaiseForm = (pose) => {
    // Calcular ángulos importantes para la elevación de piernas
    const leftHipAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftHip, 
      pose.leftKnee
    );
    
    const rightHipAngle = calculateAngle(
      pose.rightShoulder, 
      pose.rightHip, 
      pose.rightKnee
    );
    
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;
    
    // Ángulo de flexión de la rodilla para verificar que las piernas estén extendidas
    const leftKneeAngle = calculateAngle(
      pose.leftHip, 
      pose.leftKnee, 
      pose.leftAnkle
    );
    
    const rightKneeAngle = calculateAngle(
      pose.rightHip, 
      pose.rightKnee, 
      pose.rightAnkle
    );
    
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido
    // Si hay un cambio demasiado brusco, podría ser un error de detección
    const angleChange = Math.abs(avgHipAngle - lastValidHipAngle);
    if (angleChange > 30 && consecutiveCorrectFrames < 3) {
      // Probablemente es ruido, ignoramos esta lectura
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidHipAngle(avgHipAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Verificar alineación de piernas (si están juntas)
    const kneeXDiff = Math.abs(pose.leftKnee.x - pose.rightKnee.x);
    const ankleXDiff = Math.abs(pose.leftAnkle.x - pose.rightAnkle.x);
    const legsAligned = kneeXDiff < 30 && ankleXDiff < 30;

    // Verificar si la espalda baja está arqueada (problema común)
    // Calculamos la diferencia de altura entre la cadera y los hombros cuando debería estar acostado
    const hipToShoulderYDiff = Math.abs(pose.leftHip.y - pose.leftShoulder.y);
    const backFlat = hipToShoulderYDiff < 40; // Si es pequeña, están más o menos al mismo nivel
    
    // Verificar si las piernas alcanzan la altura adecuada
    // En una elevación completa, el ángulo de la cadera debería ser aproximadamente 90 grados
    const goodHeight = avgHipAngle <= 110 && avgHipAngle >= 70;
    
    // Verificar si las piernas están extendidas correctamente
    const legsExtended = avgKneeAngle > 150; // Piernas casi rectas
    
    // Lógica para determinar la fase del ejercicio con mayor robustez
    let updatedExercisePhase = exercisePhase;
    
    // Necesitamos varios frames consecutivos válidos para confirmar un cambio de fase
    if (consecutiveCorrectFrames >= 3) {
      if (avgHipAngle < 120 && !repInProgress) {
        // Comenzando una elevación de piernas
        updatedExercisePhase = 'up';
        setRepInProgress(true);
      } else if (avgHipAngle > 160 && repInProgress && exercisePhase === 'up') {
        // Completó la elevación
        updatedExercisePhase = 'down';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta
        const correctForm = legsAligned && legsExtended && backFlat && goodHeight;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (exercisePhase === 'none' && avgHipAngle > 160) {
        // Posición inicial
        updatedExercisePhase = 'down';
      }
    }
    
    if (updatedExercisePhase !== exercisePhase) {
      setExercisePhase(updatedExercisePhase);
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Priorizar feedback por gravedad de los problemas
    if (!backFlat) {
      feedbackMessage = 'Mantén la espalda baja pegada al suelo';
      poseCorrect = false;
      currentIssues.backArching += 1;
    } else if (!legsExtended) {
      feedbackMessage = 'Mantén las piernas rectas durante el ejercicio';
      poseCorrect = false;
      currentIssues.controlledMovement += 1;
    } else if (!legsAligned) {
      feedbackMessage = 'Mantén ambas piernas juntas y alineadas';
      poseCorrect = false;
      currentIssues.legAlignment += 1;
    } else if (avgHipAngle < 70 && exercisePhase === 'up') {
      feedbackMessage = 'No eleves demasiado las piernas, mantén control';
      poseCorrect = false;
      currentIssues.legHeight += 1;
    } else if (avgHipAngle > 110 && avgHipAngle < 150 && exercisePhase === 'up') {
      feedbackMessage = 'Eleva un poco más las piernas para completar el movimiento';
      poseCorrect = false;
      currentIssues.hipFlexion += 1;
    } else if (avgHipAngle < 110 && avgHipAngle > 70 && exercisePhase === 'up') {
      feedbackMessage = 'Buena posición, mantén el control';
      poseCorrect = true;
    } else if (avgHipAngle > 160) {
      feedbackMessage = 'Buena posición de inicio, piernas extendidas';
      poseCorrect = true;
    }
    
    // Actualizar registro de problemas posturales
    setPosturalIssues(currentIssues);
    
    setFeedback(feedbackMessage);
    setIsCorrectPose(poseCorrect);
    
    // Verificar si se ha completado el ejercicio
    if (repCount >= totalReps && !isCompleted) {
      setIsCompleted(true);
      generateSummaryFeedback();
    }
  };

  const generateSummaryFeedback = () => {
    // Encontrar los problemas más frecuentes
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '';
    
    // Calificación general basada en repeticiones correctas
    if (correctPostureCount >= 4) {
      summaryFeedback = '¡Excelente! Has completado 5 elevaciones de piernas con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'legAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener ambas piernas juntas y alineadas durante todo el movimiento.\n\n';
      } else if (issues[0][0] === 'hipFlexion' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en alcanzar una mejor flexión de cadera, elevando más las piernas.\n\n';
      } else if (issues[0][0] === 'backArching' && issues[0][1] > 0) {
        summaryFeedback += '• Es importante mantener la espalda baja pegada al suelo para evitar lesiones.\n\n';
      } else if (issues[0][0] === 'legHeight' && issues[0][1] > 0) {
        summaryFeedback += '• Controla la altura máxima para mantener el ejercicio efectivo y seguro.\n\n';
      } else if (issues[0][0] === 'controlledMovement' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén las piernas extendidas y el movimiento controlado durante todo el ejercicio.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'legAlignment') {
          summaryFeedback += '• También presta atención a la alineación de tus piernas, manteniéndolas juntas.\n\n';
        } else if (issues[1][0] === 'hipFlexion') {
          summaryFeedback += '• Trabaja en lograr la altura adecuada en cada repetición.\n\n';
        } else if (issues[1][0] === 'backArching') {
          summaryFeedback += '• No olvides mantener la espalda pegada al suelo durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'legHeight') {
          summaryFeedback += '• Recuerda mantener un rango de movimiento adecuado, sin elevar demasiado.\n\n';
        } else if (issues[1][0] === 'controlledMovement') {
          summaryFeedback += '• Enfócate en mantener las piernas rectas durante toda la ejecución.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setExercisePhase('none');
    setFeedback('Prepárate para hacer elevaciones de piernas');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      legAlignment: 0,
      hipFlexion: 0,
      backArching: 0,
      legHeight: 0,
      controlledMovement: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidHipAngle(170);
    setRepInProgress(false);
  };

  return (
    <PoseVisualization
      onPoseDetected={onPoseDetected}
      repCount={repCount}
      feedback={feedback}
      isCorrectPose={isCorrectPose}
      isCompleted={isCompleted}
      totalReps={totalReps}
      resetExercise={resetExercise}
      overlayOpacity={overlayOpacity}
      instructionsText={instructionsText}
      onFlipCamera={handleFlipCamera}
      isBackCamera={isBackCamera}
    />
  );
};

export default LegRaisesCorrection;