import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const LateralRaiseCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [raisePhase, setRaisePhase] = useState('ready');
  const [feedback, setFeedback] = useState('Prepárate para hacer elevaciones laterales');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Estados para el conteo mejorado de repeticiones
  const [lastArmAngle, setLastArmAngle] = useState(0);
  const [peakAngleReached, setPeakAngleReached] = useState(false);
  const [repStarted, setRepStarted] = useState(false);
  const [stableFrameCount, setStableFrameCount] = useState(0);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armSynchronization: 0,
    shoulderElevation: 0,
    torsoStability: 0,
    rangeOfMotion: 0,
    movementSpeed: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  const minRangeAngle = 60; // Ángulo mínimo para considerar que llegó al peak
  const maxStartAngle = 25; // Ángulo máximo para considerar posición inicial
  
  // Texto de instrucciones
  const instructionsText = 
    "Para realizar correctamente las elevaciones laterales:\n\n" +
    "1. Ponte de frente a la cámara con los pies separados al ancho de hombros.\n\n" +
    "2. Mantén la cámara a una distancia donde se vean ambos brazos completamente.\n\n" +
    "3. Comienza con los brazos relajados a los costados del cuerpo.\n\n" +
    "4. Si usas mancuernas, que sean ligeras (1-3 kg para principiantes).\n\n" +
    "5. Eleva ambos brazos lateralmente hasta la altura de los hombros.\n\n" +
    "6. Baja lentamente controlando el movimiento.\n\n" +
    "7. Mantén una postura erguida durante todo el ejercicio.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para animar el overlay
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isCorrectPose ? 0.15 : 0.35,
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

  // Función mejorada para calcular el ángulo del brazo
  const calculateArmAngle = (shoulder, elbow, wrist) => {
    if (!shoulder || !elbow || !wrist) return 0;
    
    // Vector del brazo (hombro a codo)
    const upperArmVector = {
      x: elbow.x - shoulder.x,
      y: elbow.y - shoulder.y
    };
    
    // Vector del antebrazo (codo a muñeca)
    const forearmVector = {
      x: wrist.x - elbow.x,
      y: wrist.y - elbow.y
    };
    
    // Calcular el ángulo del brazo respecto a la vertical
    const verticalVector = { x: 0, y: 1 };
    const armVector = {
      x: upperArmVector.x + forearmVector.x * 0.5, // Promedio ponderado
      y: upperArmVector.y + forearmVector.y * 0.5
    };
    
    const dotProduct = Math.abs(armVector.x);
    const armMagnitude = Math.sqrt(armVector.x * armVector.x + armVector.y * armVector.y);
    
    if (armMagnitude === 0) return 0;
    
    const angle = Math.acos(Math.min(dotProduct / armMagnitude, 1)) * (180 / Math.PI);
    return Math.min(angle, 90); // Limitar a 90 grados máximo
  };

  const onPoseDetected = (poses) => {
    if (!poses || poses.length === 0) {
      setFeedback('No se detecta tu postura. Asegúrate de estar visible en la cámara');
      setIsCorrectPose(false);
      return;
    }
    
    const pose = poses[0]?.pose;
    if (!pose) return;
    
    // Verificar keypoints necesarios
    const requiredKeypoints = [
      pose.leftShoulder, pose.rightShoulder,
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist,
      pose.leftHip, pose.rightHip
    ];
    
    const validKeypoints = requiredKeypoints.filter(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (validKeypoints.length < 6) {
      setFeedback('Ajusta tu posición para que pueda verte mejor');
      setIsCorrectPose(false);
      setStableFrameCount(0);
      return;
    }

    setStableFrameCount(prev => prev + 1);
    
    // Solo analizar después de tener frames estables
    if (stableFrameCount > 3) {
      analyzeLateralRaiseForm(pose);
    }
  };

  const analyzeLateralRaiseForm = (pose) => {
    // Calcular ángulos de ambos brazos
    const leftArmAngle = calculateArmAngle(
      pose.leftShoulder,
      pose.leftElbow,
      pose.leftWrist
    );
    
    const rightArmAngle = calculateArmAngle(
      pose.rightShoulder,
      pose.rightElbow,
      pose.rightWrist
    );

    // Usar el promedio de ambos brazos para el análisis principal
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    
    // Suavizar el ángulo para evitar cambios bruscos
    const smoothedAngle = lastArmAngle * 0.3 + avgArmAngle * 0.7;
    setLastArmAngle(smoothedAngle);
    
    // === LÓGICA DE CONTEO DE REPETICIONES MEJORADA ===
    
    // Estado 1: Posición inicial (brazos abajo)
    if (!repStarted && smoothedAngle < maxStartAngle) {
      setRaisePhase('ready');
      setPeakAngleReached(false);
    }
    
    // Estado 2: Iniciando elevación
    else if (!repStarted && smoothedAngle > maxStartAngle + 5) {
      setRepStarted(true);
      setRaisePhase('up');
      setPeakAngleReached(false);
    }
    
    // Estado 3: Alcanzando el peak (brazos arriba)
    else if (repStarted && !peakAngleReached && smoothedAngle >= minRangeAngle) {
      setPeakAngleReached(true);
      setRaisePhase('peak');
    }
    
    // Estado 4: Bajando y completando repetición
    else if (repStarted && peakAngleReached && smoothedAngle < maxStartAngle) {
      setRepCount(prev => prev + 1);
      setRepStarted(false);
      setPeakAngleReached(false);
      setRaisePhase('completed');
      
      // Reset para la siguiente repetición
      setTimeout(() => {
        if (repCount + 1 < totalReps) {
          setRaisePhase('ready');
        }
      }, 500);
    }

    // === EVALUACIONES DE FORMA ===
    
    // 1. Sincronización de brazos
    const armSynchronization = Math.abs(leftArmAngle - rightArmAngle);
    const armsSynchronized = armSynchronization < 30;

    // 2. Elevación de hombros (comparar altura de hombros)
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersLevel = shoulderYDiff < 30;
    
    // 3. Estabilidad del torso
    const hipYDiff = Math.abs(pose.leftHip.y - pose.rightHip.y);
    const torsoStable = hipYDiff < 25;

    // 4. Rango de movimiento apropiado
    const goodRange = smoothedAngle <= 85; // No sobrepasar demasiado

    // === FEEDBACK INTELIGENTE ===
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};

    // Feedback basado en la fase actual
    if (raisePhase === 'ready') {
      feedbackMessage = 'Posición inicial correcta. ¡Comienza a elevar los brazos!';
      poseCorrect = true;
    }
    else if (raisePhase === 'up') {
      if (smoothedAngle < 30) {
        feedbackMessage = 'Muy bien, sigue elevando los brazos lateralmente';
        poseCorrect = true;
      } else if (smoothedAngle < 50) {
        feedbackMessage = 'Perfecto, mantén el ritmo hasta la altura de los hombros';
        poseCorrect = true;
      } else {
        feedbackMessage = 'Casi llegas al máximo, mantén el control';
        poseCorrect = true;
      }
    }
    else if (raisePhase === 'peak') {
      feedbackMessage = '¡Excelente! Ahora baja lentamente los brazos';
      poseCorrect = true;
    }
    else if (raisePhase === 'completed') {
      feedbackMessage = `¡Repetición ${repCount + 1} completada! Prepárate para la siguiente`;
      poseCorrect = true;
    }

    // Correcciones específicas que tienen prioridad sobre el feedback de fase
    if (!armsSynchronized && repStarted && smoothedAngle > 25) {
      feedbackMessage = 'Eleva ambos brazos al mismo tiempo y velocidad';
      poseCorrect = false;
      currentIssues.armSynchronization += 1;
    }
    else if (!shouldersLevel && smoothedAngle > 40) {
      feedbackMessage = 'Mantén los hombros relajados, no los subas';
      poseCorrect = false;
      currentIssues.shoulderElevation += 1;
    }
    else if (!torsoStable && smoothedAngle > 30) {
      feedbackMessage = 'Mantén el cuerpo erguido y estable';
      poseCorrect = false;
      currentIssues.torsoStability += 1;
    }
    else if (!goodRange && smoothedAngle > 85) {
      feedbackMessage = 'No eleves tanto los brazos, hasta la altura de los hombros';
      poseCorrect = false;
      currentIssues.rangeOfMotion += 1;
    }

    setPosturalIssues(currentIssues);
    setFeedback(feedbackMessage);
    setIsCorrectPose(poseCorrect);
    
    // Verificar si se completó el ejercicio
    if (repCount >= totalReps && !isCompleted) {
      setIsCompleted(true);
      generateSummaryFeedback();
    }
  };

  const generateSummaryFeedback = () => {
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '🎉 ¡Felicidades! Has completado las 5 repeticiones de elevaciones laterales.\n\n';
    
    // Consejos específicos basados en los errores más comunes
    if (issues[0][1] > 0) {
      summaryFeedback += '🎯 Áreas de mejora principales:\n\n';
      
      const topIssues = issues.filter(issue => issue[1] > 0).slice(0, 3);
      
      topIssues.forEach((issue, index) => {
        const [issueType, count] = issue;
        
        switch(issueType) {
          case 'shoulderElevation':
            summaryFeedback += `• Relajación de hombros: Mantén los hombros bajos durante todo el movimiento. Imagina que los "pegas" hacia abajo.\n\n`;
            break;
          case 'armSynchronization':
            summaryFeedback += `• Coordinación de brazos: Practica elevar ambos brazos simultáneamente. Empieza sin peso para mejorar la sincronización.\n\n`;
            break;
          case 'torsoStability':
            summaryFeedback += `• Estabilidad del core: Mantén el abdomen activado y evita balancearte durante el ejercicio.\n\n`;
            break;
          case 'rangeOfMotion':
            summaryFeedback += `• Rango de movimiento: Eleva los brazos solo hasta la altura de los hombros, no más alto.\n\n`;
            break;
          case 'movementSpeed':
            summaryFeedback += `• Control de velocidad: Realiza el movimiento más lentamente, especialmente al bajar.\n\n`;
            break;
        }
      });
    } else {
      summaryFeedback += '🌟 ¡Excelente técnica! Tu forma fue muy buena en todas las repeticiones.\n\n';
    }
    
    // Consejos generales para continuar mejorando
    summaryFeedback += '💡 Consejos para seguir mejorando:\n\n';
    summaryFeedback += '• Mantén una respiración constante: exhala al subir, inhala al bajar\n';
    summaryFeedback += '• La calidad del movimiento es más importante que el peso\n';
    summaryFeedback += '• Practica frente a un espejo para auto-corregirte\n';
    summaryFeedback += '• Aumenta el peso gradualmente solo cuando domines la técnica\n\n';
    
    summaryFeedback += '🚀 ¡Sigue practicando para fortalecer tus deltoides!';
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setRaisePhase('ready');
    setFeedback('Prepárate para hacer elevaciones laterales');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setLastArmAngle(0);
    setPeakAngleReached(false);
    setRepStarted(false);
    setStableFrameCount(0);
    setPosturalIssues({
      armSynchronization: 0,
      shoulderElevation: 0,
      torsoStability: 0,
      rangeOfMotion: 0,
      movementSpeed: 0
    });
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

export default LateralRaiseCorrection;