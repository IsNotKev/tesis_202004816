import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const FrontRaiseCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [raisePhase, setRaisePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer elevaciones frontales');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armSymmetry: 0,
    shoulderStability: 0,
    backPosture: 0,
    controlledMovement: 0,
    rangeOfMotion: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5; // Repeticiones moderadas para ejercicio de aislamiento
  const confidenceThreshold = 0.45; // Confianza moderada
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidArmHeight, setLastValidArmHeight] = useState('down');
  const [repInProgress, setRepInProgress] = useState(false);
  const [peakPosition, setPeakPosition] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante las elevaciones frontales, sigue estas instrucciones:\n\n" +
    "1. Colócate de perfil (lado) a la cámara para que se vean claramente tus brazos y espalda.\n\n" +
    "2. Mantén los pies separados al ancho de los hombros para mayor estabilidad.\n\n" +
    "3. Asegúrate de tener suficiente espacio para elevar los brazos completamente.\n\n" +
    "4. Usa pesas ligeras o simula el movimiento sin peso para empezar.\n\n" +
    "5. Mantén buena iluminación y evita sombras que interfieran con la detección.\n\n" +
    "6. Realiza el movimiento de forma controlada, sin balanceo del cuerpo.";

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
      pose.leftHip, pose.rightHip,
      pose.nose // Para verificar posición de la cabeza
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Colócate de perfil para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA ELEVACIONES FRONTALES
    analyzeFrontRaiseForm(pose);
  };

  const analyzeFrontRaiseForm = (pose) => {
    // Calcular ángulos de los brazos (hombro-codo-muñeca)
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

    // Calcular elevación de los brazos basado en la altura de las muñecas vs hombros
    const shoulderMidY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const leftWristHeight = pose.leftShoulder.y - pose.leftWrist.y;
    const rightWristHeight = pose.rightShoulder.y - pose.rightWrist.y;
    const avgWristHeight = (leftWristHeight + rightWristHeight) / 2;
    
    // Determinar la fase del movimiento basado en la altura de las muñecas
    let currentArmHeight = 'down';
    if (avgWristHeight > 80) {
      currentArmHeight = 'high'; // Brazos a la altura de los hombros o más
    } else if (avgWristHeight > 40) {
      currentArmHeight = 'mid'; // Brazos a media altura
    }
    
    // Verificar simetría de brazos
    const wristHeightDiff = Math.abs(leftWristHeight - rightWristHeight);
    const armsSymmetrical = wristHeightDiff < 50; // Tolerancia para principiantes
    
    // Verificar que los brazos estén relativamente extendidos (no muy flexionados)
    const leftArmExtended = leftArmAngle > 140; // Brazo relativamente recto
    const rightArmExtended = rightArmAngle > 140;
    const armsExtended = leftArmExtended && rightArmExtended;
    
    // Verificar alineación de hombros (estabilidad)
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersStable = shoulderYDiff < 35;
    
    // Verificar postura de la espalda usando hombros y cadera
    const backAngle = calculateAngle(
      pose.nose,
      pose.leftShoulder,
      pose.leftHip
    );
    const goodBackPosture = backAngle > 160 && backAngle < 200; // Espalda relativamente recta
    
    // Verificar control del movimiento (no muy rápido)
    const heightChange = Math.abs(avgWristHeight - 
      (lastValidArmHeight === 'high' ? 100 : lastValidArmHeight === 'mid' ? 60 : 20));
    const controlledMovement = heightChange < 60; // No cambios muy bruscos
    
    // Lógica para determinar la fase de la elevación frontal
    let updatedRaisePhase = raisePhase;
    
    if (consecutiveCorrectFrames >= 3) {
      if (currentArmHeight === 'high' && !repInProgress) {
        // Brazos elevados - inicio de repetición
        updatedRaisePhase = 'raised';
        setRepInProgress(true);
        setPeakPosition(true);
      } else if (currentArmHeight === 'down' && repInProgress && raisePhase === 'raised') {
        // Brazos bajados - completó una repetición
        updatedRaisePhase = 'lowered';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        setPeakPosition(false);
        
        // Verificar si la forma fue correcta durante esta repetición
        const correctForm = armsSymmetrical && armsExtended && shouldersStable && goodBackPosture;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (raisePhase === 'none' && currentArmHeight === 'down') {
        // Posición inicial
        updatedRaisePhase = 'lowered';
      }
    }
    
    if (updatedRaisePhase !== raisePhase) {
      setRaisePhase(updatedRaisePhase);
    }
    
    setLastValidArmHeight(currentArmHeight);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Verificar problemas específicos del ejercicio
    if (!shouldersStable) {
      feedbackMessage = 'Mantén los hombros estables, evita balancearte';
      poseCorrect = false;
      currentIssues.shoulderStability += 1;
    } else if (!armsSymmetrical) {
      feedbackMessage = 'Eleva ambos brazos a la misma altura';
      poseCorrect = false;
      currentIssues.armSymmetry += 1;
    } else if (!armsExtended && currentArmHeight !== 'down') {
      feedbackMessage = 'Mantén los brazos más extendidos durante la elevación';
      poseCorrect = false;
      currentIssues.rangeOfMotion += 1;
    } else if (!goodBackPosture) {
      feedbackMessage = 'Mantén la espalda recta, no te inclines hacia adelante';
      poseCorrect = false;
      currentIssues.backPosture += 1;
    } else if (!controlledMovement && consecutiveCorrectFrames > 5) {
      feedbackMessage = 'Controla la velocidad del movimiento, más lento';
      poseCorrect = false;
      currentIssues.controlledMovement += 1;
    } else if (currentArmHeight === 'high' && armsSymmetrical && armsExtended) {
      feedbackMessage = 'Excelente posición en la parte alta, mantén el control';
      poseCorrect = true;
    } else if (currentArmHeight === 'mid') {
      feedbackMessage = 'Buen rango medio, continúa con control';
      poseCorrect = true;
    } else if (currentArmHeight === 'down' && shouldersStable) {
      feedbackMessage = 'Buena posición inicial, brazos relajados';
      poseCorrect = true;
    } else if (avgWristHeight < 20) {
      feedbackMessage = 'Posición de inicio correcta';
      poseCorrect = true;
    } else {
      feedbackMessage = 'Mantén el control y la simetría en el movimiento';
      poseCorrect = false;
    }
    
    // Feedback específico para rango de movimiento
    if (currentArmHeight === 'high' && avgWristHeight < 60) {
      feedbackMessage = 'Trata de elevar los brazos hasta la altura de los hombros';
      poseCorrect = false;
      currentIssues.rangeOfMotion += 1;
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
    
    if (successRate >= 85) {
      summaryFeedback = `¡Excelente técnica! Has completado ${totalReps} elevaciones frontales con muy buena forma.\n\n`;
    } else if (successRate >= 70) {
      summaryFeedback = `Buena técnica. Has completado las elevaciones con forma sólida.\n\n`;
    } else if (successRate >= 50) {
      summaryFeedback = `Técnica aceptable, pero hay áreas de mejora .\n\n`;
    } else {
      summaryFeedback = `Has completado las repeticiones, pero necesitas trabajar en la técnica.\n\n`;
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'armSymmetry' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en elevar ambos brazos a la misma altura de forma simétrica.\n\n';
      } else if (issues[0][0] === 'shoulderStability' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener los hombros estables, evita balancearte durante el movimiento.\n\n';
      } else if (issues[0][0] === 'backPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén la espalda recta durante todo el ejercicio, evita inclinarte hacia adelante.\n\n';
      } else if (issues[0][0] === 'rangeOfMotion' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en el rango de movimiento: eleva hasta la altura de los hombros con brazos extendidos.\n\n';
      } else if (issues[0][0] === 'controlledMovement' && issues[0][1] > 0) {
        summaryFeedback += '• Realiza el movimiento de forma más controlada, evita movimientos bruscos.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 1) {
        if (issues[1][0] === 'armSymmetry') {
          summaryFeedback += '• También trabaja en la simetría de los brazos durante la elevación.\n\n';
        } else if (issues[1][0] === 'shoulderStability') {
          summaryFeedback += '• Recuerda mantener los hombros estables y el core activado.\n\n';
        } else if (issues[1][0] === 'backPosture') {
          summaryFeedback += '• No olvides mantener una postura erguida durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'rangeOfMotion') {
          summaryFeedback += '• Practica el rango completo de movimiento con control.\n\n';
        } else if (issues[1][0] === 'controlledMovement') {
          summaryFeedback += '• Enfócate en la calidad del movimiento sobre la velocidad.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu técnica es excelente! Tienes muy buen control del ejercicio.';
    }
    
    // Añadir consejos generales para mejorar
    if (successRate < 85) {
      summaryFeedback += '💪 Consejo: Practica frente al espejo para mejorar la simetría y considera usar pesos más ligeros para perfeccionar la técnica.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setRaisePhase('none');
    setFeedback('Prepárate para hacer elevaciones frontales');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      armSymmetry: 0,
      shoulderStability: 0,
      backPosture: 0,
      controlledMovement: 0,
      rangeOfMotion: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidArmHeight('down');
    setRepInProgress(false);
    setPeakPosition(false);
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

export default FrontRaiseCorrection;