import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const JumpingJackCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [jackPhase, setJackPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer saltos de tijera');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armCoordination: 0,
    legCoordination: 0,
    shoulderAlignment: 0,
    landingPosture: 0,
    synchronization: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 10; // Más repeticiones para saltos de tijera
  const confidenceThreshold = 0.4; // Un poco más flexible para principiantes
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidArmPosition, setLastValidArmPosition] = useState('down');
  const [lastValidLegPosition, setLastValidLegPosition] = useState('together');
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante los saltos de tijera, sigue estas instrucciones:\n\n" +
    "1. Colócate de frente a la cámara para que se vean claramente tus brazos y piernas.\n\n" +
    "2. Asegúrate de tener suficiente espacio para extender brazos y piernas completamente.\n\n" +
    "3. Mantén buena iluminación y evita sombras que puedan interferir con la detección.\n\n" +
    "4. Mantén todo tu cuerpo visible durante todo el ejercicio, sin salirte del encuadre.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.\n\n" +
    "6. Realiza los movimientos de forma controlada, no demasiado rápido al principio.";

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

  // Función para calcular la distancia entre dos puntos
  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  };

  const onPoseDetected = (poses) => {
    if (!poses || poses.length === 0) return;
    
    const pose = poses[0]?.pose;
    
    // Verificar que tenemos todos los keypoints necesarios con suficiente confianza
    const keypoints = [
      pose.leftShoulder, pose.rightShoulder,
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist,
      pose.leftHip, pose.rightHip,
      pose.leftKnee, pose.rightKnee,
      pose.leftAnkle, pose.rightAnkle
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición frontal para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA SALTOS DE TIJERA
    analyzeJumpingJackForm(pose);
  };

  const analyzeJumpingJackForm = (pose) => {
    // Calcular posiciones de brazos - ángulo del hombro al codo
    const leftArmAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftElbow,
      pose.leftWrist
    );
    
    const rightArmAngle = calculateAngle(
      pose.rightShoulder,
      pose.rightElbow,
      pose.rightWrist
    );

    // Calcular si los brazos están arriba o abajo basado en la posición Y
    const shoulderMidY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const wristMidY = (pose.leftWrist.y + pose.rightWrist.y) / 2;
    const armsRaised = wristMidY < shoulderMidY - 40; // Los brazos están por encima de los hombros
    
    // Calcular separación de piernas
    const legSeparation = Math.abs(pose.leftAnkle.x - pose.rightAnkle.x);
    const hipSeparation = Math.abs(pose.leftHip.x - pose.rightHip.x);
    const legsSeparated = legSeparation > hipSeparation * 1.8; // Piernas más separadas que las caderas
    
    // Verificar alineación de hombros
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 40; // Más flexible para principiantes
    
    // Verificar simetría de brazos (ambos a la misma altura aproximada)
    const wristYDiff = Math.abs(pose.leftWrist.y - pose.rightWrist.y);
    const armsSymmetrical = wristYDiff < 60; // Flexibilidad para principiantes
    
    // Verificar simetría de piernas
    const ankleYDiff = Math.abs(pose.leftAnkle.y - pose.rightAnkle.y);
    const legsSymmetrical = ankleYDiff < 40;
    
    // Determinar la posición actual
    const currentArmPosition = armsRaised ? 'up' : 'down';
    const currentLegPosition = legsSeparated ? 'apart' : 'together';
    
    // Lógica para determinar la fase del salto de tijera
    let updatedJackPhase = jackPhase;
    
    if (consecutiveCorrectFrames >= 2) { // Menos estricto para movimientos más rápidos
      if (currentArmPosition === 'up' && currentLegPosition === 'apart' && !repInProgress) {
        // Posición abierta (brazos arriba, piernas separadas)
        updatedJackPhase = 'open';
        setRepInProgress(true);
      } else if (currentArmPosition === 'down' && currentLegPosition === 'together' && repInProgress && jackPhase === 'open') {
        // Posición cerrada (brazos abajo, piernas juntas) - completó una repetición
        updatedJackPhase = 'closed';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta durante esta repetición
        const correctForm = shouldersAligned && armsSymmetrical && legsSymmetrical;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (jackPhase === 'none' && currentArmPosition === 'down' && currentLegPosition === 'together') {
        // Posición inicial
        updatedJackPhase = 'closed';
      }
    }
    
    if (updatedJackPhase !== jackPhase) {
      setJackPhase(updatedJackPhase);
    }
    
    setLastValidArmPosition(currentArmPosition);
    setLastValidLegPosition(currentLegPosition);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Verificar coordinación y simetría
    if (!shouldersAligned) {
      feedbackMessage = 'Mantén los hombros nivelados durante el movimiento';
      poseCorrect = false;
      currentIssues.shoulderAlignment += 1;
    } else if (!armsSymmetrical && (currentArmPosition === 'up' || jackPhase === 'open')) {
      feedbackMessage = 'Trata de subir ambos brazos a la misma altura';
      poseCorrect = false;
      currentIssues.armCoordination += 1;
    } else if (!legsSymmetrical) {
      feedbackMessage = 'Mantén ambos pies al mismo nivel';
      poseCorrect = false;
      currentIssues.landingPosture += 1;
    } else if ((currentArmPosition === 'up' && currentLegPosition === 'together') || 
               (currentArmPosition === 'down' && currentLegPosition === 'apart')) {
      feedbackMessage = 'Coordina brazos y piernas: arriba con separadas, abajo con juntas';
      poseCorrect = false;
      currentIssues.synchronization += 1;
    } else if (jackPhase === 'open' && armsRaised && legsSeparated) {
      feedbackMessage = 'Excelente posición abierta, mantén el control';
      poseCorrect = true;
    } else if (jackPhase === 'closed' && !armsRaised && !legsSeparated) {
      feedbackMessage = 'Buena posición cerrada, listo para el siguiente';
      poseCorrect = true;
    } else if (currentArmPosition === 'up' && currentLegPosition === 'apart') {
      feedbackMessage = 'Buena coordinación, mantén el ritmo';
      poseCorrect = true;
    } else if (currentArmPosition === 'down' && currentLegPosition === 'together') {
      feedbackMessage = 'Buena posición inicial';
      poseCorrect = true;
    } else {
      feedbackMessage = 'Mantén la coordinación entre brazos y piernas';
      poseCorrect = false;
      currentIssues.synchronization += 1;
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
    const successRate = (correctPostureCount / totalReps) * 100;
    
    if (successRate >= 80) {
      summaryFeedback = `¡Excelente! Has completado ${totalReps} saltos de tijera con muy buena coordinación.\n\n`;
    } else if (successRate >= 60) {
      summaryFeedback = `Buen trabajo. Has completado los saltos con coordinación aceptable (${Math.round(successRate)}% de forma correcta).\n\n`;
    } else if (successRate >= 40) {
      summaryFeedback = `Has completado las repeticiones, pero puedes mejorar tu coordinación (${Math.round(successRate)}% de forma correcta).\n\n`;
    } else {
      summaryFeedback = `Has completado las repeticiones, pero necesitas practicar más la coordinación (${Math.round(successRate)}% de forma correcta).\n\n`;
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'synchronization' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en la coordinación: cuando subas los brazos, separa las piernas al mismo tiempo.\n\n';
      } else if (issues[0][0] === 'armCoordination' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en subir ambos brazos a la misma altura de forma simétrica.\n\n';
      } else if (issues[0][0] === 'shoulderAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén los hombros nivelados durante todo el movimiento.\n\n';
      } else if (issues[0][0] === 'landingPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener ambos pies al mismo nivel al aterrizar.\n\n';
      } else if (issues[0][0] === 'legCoordination' && issues[0][1] > 0) {
        summaryFeedback += '• Practica separar las piernas de forma más simétrica.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 2) {
        if (issues[1][0] === 'synchronization') {
          summaryFeedback += '• También practica la sincronización entre brazos y piernas.\n\n';
        } else if (issues[1][0] === 'armCoordination') {
          summaryFeedback += '• Recuerda mantener los brazos simétricos al subirlos.\n\n';
        } else if (issues[1][0] === 'shoulderAlignment') {
          summaryFeedback += '• No olvides mantener los hombros alineados.\n\n';
        } else if (issues[1][0] === 'landingPosture') {
          summaryFeedback += '• Controla el aterrizaje para mantener ambos pies estables.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu coordinación es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (successRate < 80) {
      summaryFeedback += '💪 Consejo: Practica el movimiento lentamente primero, enfocándote en la coordinación antes que en la velocidad.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setJackPhase('none');
    setFeedback('Prepárate para hacer saltos de tijera');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      armCoordination: 0,
      legCoordination: 0,
      shoulderAlignment: 0,
      landingPosture: 0,
      synchronization: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidArmPosition('down');
    setLastValidLegPosition('together');
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

export default JumpingJackCorrection;