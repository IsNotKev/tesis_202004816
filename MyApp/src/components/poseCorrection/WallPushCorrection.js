import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const WallPushUpCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [pushUpPhase, setPushUpPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer flexiones de pared');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armAlignment: 0,
    shoulderPosition: 0,
    bodyAlignment: 0,
    elbowPosition: 0,
    handPosition: 0,
    rangeOfMotion: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio (más flexible para principiantes)
  const totalReps = 5;
  const confidenceThreshold = 0.45; // Más bajo para ser más flexible
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidElbowAngle, setLastValidElbowAngle] = useState(170);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante las flexiones de pared, sigue estas instrucciones:\n\n" +
    "1. Párate frente a una pared a un brazo de distancia aproximadamente.\n\n" +
    "2. Coloca la cámara de lado (perfil) para que se vean claramente tus brazos, hombros y torso.\n\n" +
    "3. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "4. Mantén todo tu cuerpo visible durante el ejercicio, especialmente los brazos y el torso.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.\n\n" +
    "6. Coloca las palmas contra la pared a la altura del pecho, separadas al ancho de los hombros.";

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
      pose.leftShoulder, pose.rightShoulder,
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist,
      pose.leftHip, pose.rightHip
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición de perfil para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA FLEXIONES DE PARED
    analyzeWallPushUpForm(pose);
  };

  const analyzeWallPushUpForm = (pose) => {
    // Calcular ángulos importantes para las flexiones de pared
    const leftElbowAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftElbow, 
      pose.leftWrist
    );
    
    const rightElbowAngle = calculateAngle(
      pose.rightShoulder, 
      pose.rightElbow, 
      pose.rightWrist
    );
    
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido (más tolerante para principiantes)
    const angleChange = Math.abs(avgElbowAngle - lastValidElbowAngle);
    if (angleChange > 40 && consecutiveCorrectFrames < 2) {
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidElbowAngle(avgElbowAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Verificar alineación del cuerpo (hombros-cadera)
    const leftBodyAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftHip,
      { x: pose.leftHip.x, y: pose.leftHip.y + 100 } // punto imaginario hacia abajo
    );
    
    const rightBodyAngle = calculateAngle(
      pose.rightShoulder,
      pose.rightHip,
      { x: pose.rightHip.x, y: pose.rightHip.y + 100 }
    );
    
    const avgBodyAngle = (leftBodyAngle + rightBodyAngle) / 2;

    // Verificar alineación de hombros
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 40; // Más tolerante

    // Verificar alineación de muñecas/manos
    const wristYDiff = Math.abs(pose.leftWrist.y - pose.rightWrist.y);
    const handsAligned = wristYDiff < 50; // Más tolerante
    
    // Verificar posición de codos (no demasiado separados)
    const elbowDistance = Math.abs(pose.leftElbow.x - pose.rightElbow.x);
    const shoulderDistance = Math.abs(pose.leftShoulder.x - pose.rightShoulder.x);
    const elbowsWellPositioned = elbowDistance < shoulderDistance * 1.8; // Más flexible

    // Lógica para determinar la fase de la flexión de pared
    let updatedPushUpPhase = pushUpPhase;
    
    // Necesitamos menos frames consecutivos válidos para ser más flexible
    if (consecutiveCorrectFrames >= 2) {
      if (avgElbowAngle < 130 && !repInProgress) { // Más flexible en el ángulo mínimo
        // Comenzando una flexión (acercándose a la pared)
        updatedPushUpPhase = 'in';
        setRepInProgress(true);
      } else if (avgElbowAngle > 155 && repInProgress && pushUpPhase === 'in') { // Más flexible en el retorno
        // Completó la flexión (alejándose de la pared)
        updatedPushUpPhase = 'out';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta (criterios más flexibles)
        const correctForm = shouldersAligned && handsAligned && elbowsWellPositioned && avgBodyAngle > 150;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (pushUpPhase === 'none' && avgElbowAngle > 155) {
        // Posición inicial
        updatedPushUpPhase = 'out';
      }
    }
    
    if (updatedPushUpPhase !== pushUpPhase) {
      setPushUpPhase(updatedPushUpPhase);
    }
    
    // Proporcionar feedback específico basado en la forma (más alentador)
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    if (avgElbowAngle < 90) {
      feedbackMessage = 'Muy bien, pero no necesitas acercarte tanto a la pared';
      poseCorrect = true; // Seguimos siendo positivos
      currentIssues.rangeOfMotion += 1;
    } else if (!shouldersAligned) {
      feedbackMessage = 'Mantén los hombros nivelados';
      poseCorrect = false;
      currentIssues.shoulderPosition += 1;
    } else if (!handsAligned) {
      feedbackMessage = 'Intenta mantener las manos a la misma altura';
      poseCorrect = false;
      currentIssues.handPosition += 1;
    } else if (!elbowsWellPositioned) {
      feedbackMessage = 'Mantén los codos cerca del cuerpo, no muy separados';
      poseCorrect = false;
      currentIssues.elbowPosition += 1;
    } else if (avgBodyAngle < 140) {
      feedbackMessage = 'Mantén el cuerpo recto, como una tabla';
      poseCorrect = false;
      currentIssues.bodyAlignment += 1;
    } else if (avgElbowAngle < 140 && avgElbowAngle > 100 && pushUpPhase === 'in') {
      feedbackMessage = '¡Perfecto! Mantén esa posición controlada';
      poseCorrect = true;
    } else if (avgElbowAngle > 155) {
      feedbackMessage = 'Excelente posición de inicio';
      poseCorrect = true;
    } else {
      feedbackMessage = '¡Muy bien! Sigue así';
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
    
    // Calificación general más alentadora para principiantes
    if (correctPostureCount >= 4) {
      summaryFeedback = '🌟 ¡Excelente trabajo! Has completado 5 flexiones de pared con muy buena forma. ¡Eres genial!\n\n';
    } else if (correctPostureCount >= 3) {
      summaryFeedback = '👏 ¡Muy bien! Has completado las repeticiones con buena forma. Sigue practicando así.\n\n';
    } else if (correctPostureCount >= 1) {
      summaryFeedback = '👍 Buen esfuerzo. Has completado las repeticiones. Con práctica mejorarás aún más.\n\n';
    } else {
      summaryFeedback = '💪 ¡Completaste tu primera serie! Cada repetición es un paso adelante. ¡Sigue así!\n\n';
    }
    
    // Añadir recomendaciones específicas de manera alentadora
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Áreas de mejora para la próxima vez:\n\n';
      
      if (issues[0][0] === 'shoulderPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener los hombros nivelados durante todo el movimiento. ¡Vas por buen camino!\n\n';
      } else if (issues[0][0] === 'handPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Intenta mantener las manos a la misma altura en la pared. Con práctica será automático.\n\n';
      } else if (issues[0][0] === 'bodyAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener el cuerpo recto como una tabla. ¡Tu core se está fortaleciendo!\n\n';
      } else if (issues[0][0] === 'elbowPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén los codos cerca del cuerpo en lugar de muy separados. Esto te dará más fuerza.\n\n';
      } else if (issues[0][0] === 'armAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en la coordinación de ambos brazos para un movimiento simétrico.\n\n';
      } else if (issues[0][0] === 'rangeOfMotion' && issues[0][1] > 0) {
        summaryFeedback += '• Encuentra tu rango cómodo de movimiento. No necesitas acercarte demasiado a la pared.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'shoulderPosition') {
          summaryFeedback += '• También practica mantener los hombros estables durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'handPosition') {
          summaryFeedback += '• Recuerda colocar las manos a la misma altura antes de comenzar.\n\n';
        } else if (issues[1][0] === 'bodyAlignment') {
          summaryFeedback += '• Sigue trabajando en mantener todo el cuerpo alineado.\n\n';
        } else if (issues[1][0] === 'elbowPosition') {
          summaryFeedback += '• No olvides mantener los codos en una posición cómoda y controlada.\n\n';
        } else if (issues[1][0] === 'rangeOfMotion') {
          summaryFeedback += '• Encuentra el rango de movimiento que te resulte más cómodo y controlado.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Estás listo para desafíos mayores.';
    }
    
    // Añadir mensaje motivacional para principiantes
    summaryFeedback += '🎯 Consejo: Las flexiones de pared son perfectas para construir fuerza base. ¡Cada día serás más fuerte!';
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setPushUpPhase('none');
    setFeedback('Prepárate para hacer flexiones de pared');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      armAlignment: 0,
      shoulderPosition: 0,
      bodyAlignment: 0,
      elbowPosition: 0,
      handPosition: 0,
      rangeOfMotion: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidElbowAngle(170);
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

export default WallPushUpCorrection;