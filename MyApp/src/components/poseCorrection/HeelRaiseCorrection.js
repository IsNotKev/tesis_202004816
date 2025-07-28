import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const HeelRaiseCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [exercisePhase, setExercisePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer elevaciones de talones');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    ankleStability: 0,
    kneePosition: 0,
    hipAlignment: 0,
    shoulderPosture: 0,
    incompleteLift: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [baselineAnkleHeight, setBaselineAnkleHeight] = useState(null);
  const [repInProgress, setRepInProgress] = useState(false);
  const [initializationFrames, setInitializationFrames] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante las elevaciones de talones, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara a una distancia donde se vean claramente tus pies, piernas y torso.\n\n" +
    "2. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "3. Ponte de lado (perfil) para que se vean claramente tus tobillos y la elevación de talones.\n\n" +
    "4. Si es posible, usa calzado que permita ver claramente el movimiento del tobillo.\n\n" +
    "5. Mantén visible todo tu cuerpo durante el ejercicio, sin salirte del encuadre.\n\n" +
    "6. Colócate en posición inicial (pies planos) y espera la confirmación antes de comenzar.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para animar el overlay cuando cambia isCorrectPose
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isCorrectPose ? 0.3 : 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
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
      pose.leftAnkle, pose.rightAnkle,
      pose.leftKnee, pose.rightKnee,
      pose.leftHip, pose.rightHip,
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

    // LÓGICA ESPECÍFICA PARA ELEVACIONES DE TALONES
    analyzeHeelRaiseForm(pose);
  };

  const analyzeHeelRaiseForm = (pose) => {
    // Calcular la altura promedio de los tobillos
    const avgAnkleY = (pose.leftAnkle.y + pose.rightAnkle.y) / 2;
    
    // Calcular ángulos para verificar la postura
    const leftLegAngle = calculateAngle(
      pose.leftHip,
      pose.leftKnee,
      pose.leftAnkle
    );
    
    const rightLegAngle = calculateAngle(
      pose.rightHip,
      pose.rightKnee,
      pose.rightAnkle
    );
    
    const avgLegAngle = (leftLegAngle + rightLegAngle) / 2;
    
    // Verificar alineaciones corporales
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 30;
    
    const hipYDiff = Math.abs(pose.leftHip.y - pose.rightHip.y);
    const hipsAligned = hipYDiff < 30;
    
    const kneeYDiff = Math.abs(pose.leftKnee.y - pose.rightKnee.y);
    const kneesAligned = kneeYDiff < 30;
    
    // Fase de inicialización - establecer línea base
    if (!isInitialized) {
      if (avgLegAngle > 160 && shouldersAligned && hipsAligned && kneesAligned) {
        setInitializationFrames(prev => prev + 1);
        
        if (initializationFrames >= 20) { // Requiere 10 frames estables
          setBaselineAnkleHeight(avgAnkleY);
          setIsInitialized(true);
          setFeedback('Posición inicial detectada. ¡Comienza con las elevaciones!');
        } else {
          setFeedback(`Mantén la posición inicial... ${initializationFrames}/20`);
        }
      } else {
        setInitializationFrames(0);
        setFeedback('Colócate en posición inicial: pies planos, cuerpo erecto');
      }
      
      setIsCorrectPose(avgLegAngle > 160 && shouldersAligned && hipsAligned);
      return;
    }
    
    // Una vez inicializado, proceder con la detección de repeticiones
    if (!baselineAnkleHeight) return;
    
    // Calcular la diferencia de altura respecto a la línea base
    const heightDifference = baselineAnkleHeight - avgAnkleY; // Positivo = elevado
    const isElevated = heightDifference > 20; // Umbral de elevación (ajustable)
    const isAtBaseline = Math.abs(heightDifference) < 10; // Rango de posición base
    
    // Filtrar ruido - necesitar frames consecutivos para confirmar cambios
    if (consecutiveCorrectFrames < 3) {
      setConsecutiveCorrectFrames(prev => prev + 1);
      return;
    }
    
    // Lógica de detección de fases mejorada
    let updatedExercisePhase = exercisePhase;
    
    if (!repInProgress && isElevated && (exercisePhase === 'none' || exercisePhase === 'down')) {
      // Comenzando una elevación
      updatedExercisePhase = 'up';
      setRepInProgress(true);
    } else if (repInProgress && exercisePhase === 'up' && isAtBaseline) {
      // Completando una elevación
      updatedExercisePhase = 'down';
      setRepCount(prev => prev + 1);
      setRepInProgress(false);
      
      // Verificar si la forma fue correcta durante la repetición
      const correctForm = 
        kneesAligned && 
        hipsAligned && 
        shouldersAligned && 
        avgLegAngle > 160;
      
      if (correctForm) {
        setCorrectPostureCount(prev => prev + 1);
      }
    }
    
    if (updatedExercisePhase !== exercisePhase) {
      setExercisePhase(updatedExercisePhase);
    }
    
    // Proporcionar feedback específico
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    if (avgLegAngle < 160) {
      feedbackMessage = 'Mantén las piernas rectas durante la elevación';
      poseCorrect = false;
      currentIssues.kneePosition += 1;
    } else if (!shouldersAligned) {
      feedbackMessage = 'Mantén los hombros nivelados para mejor equilibrio';
      poseCorrect = false;
      currentIssues.shoulderPosture += 1;
    } else if (!hipsAligned) {
      feedbackMessage = 'Alinea tus caderas al mismo nivel';
      poseCorrect = false;
      currentIssues.hipAlignment += 1;
    } else if (!kneesAligned) {
      feedbackMessage = 'Mantén tus rodillas alineadas durante el ejercicio';
      poseCorrect = false;
      currentIssues.kneePosition += 1;
    } else if (repInProgress && !isElevated && exercisePhase === 'up') {
      feedbackMessage = 'Eleva más los talones para un movimiento completo';
      poseCorrect = false;
      currentIssues.incompleteLift += 1;
    } else if (exercisePhase === 'up' && isElevated) {
      feedbackMessage = '¡Excelente! Mantén la elevación y luego baja controladamente';
      poseCorrect = true;
    } else if (exercisePhase === 'down' || exercisePhase === 'none') {
      feedbackMessage = 'Buena posición base. Prepárate para la siguiente elevación';
      poseCorrect = true;
    } else {
      feedbackMessage = 'Mantén la postura correcta durante el ejercicio';
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
      summaryFeedback = '¡Excelente! Has completado 5 elevaciones de talones con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'ankleStability' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en la estabilidad de tus tobillos durante el ejercicio.\n\n';
      } else if (issues[0][0] === 'kneePosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén las rodillas rectas y alineadas durante todo el movimiento.\n\n';
      } else if (issues[0][0] === 'hipAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener las caderas niveladas para mayor estabilidad.\n\n';
      } else if (issues[0][0] === 'shoulderPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén los hombros relajados y nivelados durante el ejercicio.\n\n';
      } else if (issues[0][0] === 'incompleteLift' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de completar todo el rango de movimiento, elevando los talones al máximo posible.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'ankleStability') {
          summaryFeedback += '• También presta atención a la estabilidad de tus tobillos.\n\n';
        } else if (issues[1][0] === 'kneePosition') {
          summaryFeedback += '• No olvides mantener las rodillas rectas durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'hipAlignment') {
          summaryFeedback += '• Procura mantener las caderas niveladas para un mejor equilibrio.\n\n';
        } else if (issues[1][0] === 'shoulderPosture') {
          summaryFeedback += '• Recuerda mantener los hombros relajados y alineados.\n\n';
        } else if (issues[1][0] === 'incompleteLift') {
          summaryFeedback += '• Busca elevar los talones completamente para trabajar todo el músculo.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica. Puedes usar un punto de apoyo para mayor estabilidad si lo necesitas.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setExercisePhase('none');
    setFeedback('Prepárate para hacer elevaciones de talones');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      ankleStability: 0,
      kneePosition: 0,
      hipAlignment: 0,
      shoulderPosture: 0,
      incompleteLift: 0
    });
    setConsecutiveCorrectFrames(0);
    setBaselineAnkleHeight(null);
    setRepInProgress(false);
    setInitializationFrames(0);
    setIsInitialized(false);
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

export default HeelRaiseCorrection;