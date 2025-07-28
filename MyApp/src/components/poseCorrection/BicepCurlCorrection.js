import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const BicepCurlCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [curlPhase, setCurlPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer curl de bícep');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    elbowStability: 0,
    shoulderStability: 0,
    wristAlignment: 0,
    backPosture: 0,
    rangeOfMotion: 0,
    controlledMovement: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidElbowAngle, setLastValidElbowAngle] = useState(160);
  const [repInProgress, setRepInProgress] = useState(false);
  const [initialElbowPosition, setInitialElbowPosition] = useState(null);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el curl de bícep, sigue estas instrucciones:\n\n" +
    "1. Colócate de lado (perfil) a la cámara para que se vean claramente tus brazos y torso.\n\n" +
    "2. Mantén la cámara a una distancia donde se vea desde tu cabeza hasta la cadera.\n\n" +
    "3. Asegúrate de tener buena iluminación y contraste con el fondo.\n\n" +
    "4. Usa una mancuerna o peso que puedas controlar completamente.\n\n" +
    "5. Mantén el brazo que ejercitas visible durante todo el movimiento.\n\n" +
    "6. Comienza con el brazo extendido a los costados del cuerpo.";

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
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA CURL DE BÍCEP
    analyzeBicepCurlForm(pose);
  };

  const analyzeBicepCurlForm = (pose) => {
    // Determinar cuál brazo está siendo ejercitado basado en la posición
    // Usaremos el brazo más visible o el que esté haciendo más movimiento
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

    // Seleccionar el brazo que está siendo ejercitado (el que tiene más variación de ángulo)
    const workingElbowAngle = Math.min(leftElbowAngle, rightElbowAngle); // El que está más flexionado
    const workingSide = leftElbowAngle <= rightElbowAngle ? 'left' : 'right';
    
    const workingShoulder = workingSide === 'left' ? pose.leftShoulder : pose.rightShoulder;
    const workingElbow = workingSide === 'left' ? pose.leftElbow : pose.rightElbow;
    const workingWrist = workingSide === 'left' ? pose.leftWrist : pose.rightWrist;
    const workingHip = workingSide === 'left' ? pose.leftHip : pose.rightHip;

    // Establecer posición inicial del codo si no está definida
    if (!initialElbowPosition && consecutiveCorrectFrames > 5) {
      setInitialElbowPosition({
        x: workingElbow.x,
        y: workingElbow.y
      });
    }

    // Filtrar lecturas incorrectas/ruido
    const angleChange = Math.abs(workingElbowAngle - lastValidElbowAngle);
    if (angleChange > 40 && consecutiveCorrectFrames < 3) {
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidElbowAngle(workingElbowAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);

    // Verificar estabilidad del codo (no debe moverse mucho horizontalmente)
    let elbowStable = true;
    if (initialElbowPosition) {
      const elbowMovement = Math.abs(workingElbow.x - initialElbowPosition.x);
      elbowStable = elbowMovement < 30; // Permitir algo de movimiento natural
    }

    // Verificar estabilidad del hombro (no debe elevarse)
    const shoulderHipAngle = Math.atan2(
      workingShoulder.y - workingHip.y,
      workingShoulder.x - workingHip.x
    ) * (180 / Math.PI);
    const shoulderStable = Math.abs(shoulderHipAngle) < 30; // Torso relativamente recto

    // Verificar alineación de muñeca (debe estar en línea con el antebrazo)
    const wristElbowDistance = Math.sqrt(
      Math.pow(workingWrist.x - workingElbow.x, 2) + 
      Math.pow(workingWrist.y - workingElbow.y, 2)
    );
    const wristAligned = wristElbowDistance > 50 && wristElbowDistance < 150;

    // Verificar postura de espalda usando ambos hombros y cadera
    const backAngle = calculateAngle(
      pose.leftShoulder,
      workingHip,
      { x: workingHip.x, y: workingHip.y + 100 } // Punto vertical hacia abajo
    );
    const goodBackPosture = backAngle > 160 && backAngle < 200;

    // Lógica para determinar la fase del curl
    let updatedCurlPhase = curlPhase;
    
    if (consecutiveCorrectFrames >= 3) {
      if (workingElbowAngle < 90 && !repInProgress) {
        // Comenzando la fase concéntrica (subida)
        updatedCurlPhase = 'up';
        setRepInProgress(true);
      } else if (workingElbowAngle > 150 && repInProgress && curlPhase === 'up') {
        // Completó el curl (fase excéntrica completada)
        updatedCurlPhase = 'down';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta durante toda la repetición
        const correctForm = elbowStable && shoulderStable && wristAligned && goodBackPosture;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (curlPhase === 'none' && workingElbowAngle > 150) {
        // Posición inicial
        updatedCurlPhase = 'down';
      }
    }
    
    if (updatedCurlPhase !== curlPhase) {
      setCurlPhase(updatedCurlPhase);
    }

    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};

    if (!elbowStable) {
      feedbackMessage = 'Mantén el codo pegado al cuerpo, no lo muevas hacia adelante o atrás';
      poseCorrect = false;
      currentIssues.elbowStability += 1;
    } else if (!shoulderStable) {
      feedbackMessage = 'No levantes el hombro, mantén los hombros relajados y estables';
      poseCorrect = false;
      currentIssues.shoulderStability += 1;
    } else if (!wristAligned) {
      feedbackMessage = 'Mantén la muñeca alineada con el antebrazo';
      poseCorrect = false;
      currentIssues.wristAlignment += 1;
    } else if (!goodBackPosture) {
      feedbackMessage = 'Mantén la espalda recta, no te inclines hacia adelante o atrás';
      poseCorrect = false;
      currentIssues.backPosture += 1;
    } else if (workingElbowAngle < 45) {
      feedbackMessage = 'Excelente contracción, ahora baja lentamente';
      poseCorrect = true;
    } else if (workingElbowAngle > 150 && curlPhase === 'down') {
      feedbackMessage = 'Buena posición inicial, mantén el control';
      poseCorrect = true;
    } else if (workingElbowAngle >= 90 && workingElbowAngle <= 120 && repInProgress) {
      feedbackMessage = 'Movimiento controlado, sigue así';
      poseCorrect = true;
    } else if (angleChange > 25 && consecutiveCorrectFrames > 3) {
      feedbackMessage = 'Controla la velocidad, movimiento más lento y controlado';
      poseCorrect = false;
      currentIssues.controlledMovement += 1;
    }

    // Verificar rango de movimiento completo
    if (repInProgress && workingElbowAngle > 120 && curlPhase === 'up') {
      feedbackMessage = 'Flexiona más el brazo para completar el rango de movimiento';
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
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '';
    
    // Calificación general basada en repeticiones correctas
    if (correctPostureCount >= 6) {
      summaryFeedback = '¡Excelente! Has completado 8 curls de bícep con muy buena técnica.\n\n';
    } else if (correctPostureCount >= 4) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con técnica aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'elbowStability' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén los codos pegados al cuerpo durante todo el movimiento. Evita que se muevan hacia adelante.\n\n';
      } else if (issues[0][0] === 'shoulderStability' && issues[0][1] > 0) {
        summaryFeedback += '• Evita compensar elevando los hombros. Mantén los hombros relajados y estables.\n\n';
      } else if (issues[0][0] === 'wristAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén las muñecas en posición neutra, alineadas con los antebrazos.\n\n';
      } else if (issues[0][0] === 'backPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén una postura erguida. Evita balancearte o usar momentum.\n\n';
      } else if (issues[0][0] === 'rangeOfMotion' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja el rango completo de movimiento. Flexiona completamente el brazo en la subida.\n\n';
      } else if (issues[0][0] === 'controlledMovement' && issues[0][1] > 0) {
        summaryFeedback += '• Controla mejor la velocidad del movimiento. Evita usar momentum o movimientos bruscos.\n\n';
      }
      
      // Segundo problema más común
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'elbowStability') {
          summaryFeedback += '• También trabaja en mantener los codos estables durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'shoulderStability') {
          summaryFeedback += '• Recuerda mantener los hombros en posición neutral.\n\n';
        } else if (issues[1][0] === 'wristAlignment') {
          summaryFeedback += '• No olvides la alineación correcta de las muñecas.\n\n';
        } else if (issues[1][0] === 'backPosture') {
          summaryFeedback += '• Mantén siempre una postura corporal estable.\n\n';
        } else if (issues[1][0] === 'rangeOfMotion') {
          summaryFeedback += '• Enfócate en completar todo el rango de movimiento.\n\n';
        } else if (issues[1][0] === 'controlledMovement') {
          summaryFeedback += '• Practica movimientos más lentos y controlados.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu técnica es excelente! Sigue así.';
    }
    
    // Consejos adicionales para curl de bícep
    if (correctPostureCount < 8) {
      summaryFeedback += '\n💪 Consejos adicionales:\n';
      summaryFeedback += '• Concéntrate en la contracción del bícep en la parte superior del movimiento.\n';
      summaryFeedback += '• La fase excéntrica (bajada) debe ser controlada y lenta.\n';
      summaryFeedback += '• Respira: exhala al subir, inhala al bajar.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setCurlPhase('none');
    setFeedback('Prepárate para hacer curl de bícep');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      elbowStability: 0,
      shoulderStability: 0,
      wristAlignment: 0,
      backPosture: 0,
      rangeOfMotion: 0,
      controlledMovement: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidElbowAngle(160);
    setRepInProgress(false);
    setInitialElbowPosition(null);
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

export default BicepCurlCorrection;