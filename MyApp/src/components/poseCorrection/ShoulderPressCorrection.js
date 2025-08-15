import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const ShoulderPressCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [pressPhase, setPressPhase] = useState('ready');
  const [feedback, setFeedback] = useState('Prepárate para hacer press de hombro');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Estados para el conteo mejorado de repeticiones
  const [lastArmAngle, setLastArmAngle] = useState(90);
  const [topPositionReached, setTopPositionReached] = useState(false);
  const [repStarted, setRepStarted] = useState(false);
  const [stableFrameCount, setStableFrameCount] = useState(0);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armSynchronization: 0,
    shoulderStability: 0,
    torsoStability: 0,
    rangeOfMotion: 0,
    elbowPosition: 0,
    headPosition: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  const startingAngle = 90; // Ángulo de partida (brazos en 90°)
  const minPressAngle = 160; // Ángulo mínimo para considerar extensión completa
  const maxStartAngle = 110; // Ángulo máximo para considerar posición inicial
  
  // Texto de instrucciones
  const instructionsText = 
    "Para realizar correctamente el press de hombro con mancuernas:\n\n" +
    "1. Ponte de frente a la cámara con los pies separados al ancho de hombros.\n\n" +
    "2. Sostén las mancuernas a la altura de los hombros con los codos a 90°.\n\n" +
    "3. Mantén la espalda recta y el core activado.\n\n" +
    "4. Para principiantes, usa mancuernas ligeras (2-5 kg).\n\n" +
    "5. Presiona las mancuernas hacia arriba hasta extender completamente los brazos.\n\n" +
    "6. Baja lentamente hasta la posición inicial (codos a 90°).\n\n" +
    "7. Evita arquear excesivamente la espalda durante el movimiento.";

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

  // Función para calcular el ángulo del brazo en press de hombro
  const calculateShoulderPressAngle = (shoulder, elbow, wrist) => {
    if (!shoulder || !elbow || !wrist) return 90;
    
    // Vector del brazo superior (hombro a codo)
    const upperArmVector = {
      x: elbow.x - shoulder.x,
      y: elbow.y - shoulder.y
    };
    
    // Vector del antebrazo (codo a muñeca)
    const forearmVector = {
      x: wrist.x - elbow.x,
      y: wrist.y - elbow.y
    };
    
    // Calcular el ángulo total del brazo
    // Para press de hombro, medimos la extensión total del brazo
    const totalArmVector = {
      x: wrist.x - shoulder.x,
      y: wrist.y - shoulder.y
    };
    
    // Vector vertical hacia arriba (referencia para extensión completa)
    const verticalVector = { x: 0, y: -1 };
    
    const dotProduct = totalArmVector.x * verticalVector.x + totalArmVector.y * verticalVector.y;
    const armMagnitude = Math.sqrt(totalArmVector.x * totalArmVector.x + totalArmVector.y * totalArmVector.y);
    
    if (armMagnitude === 0) return 90;
    
    // Calcular ángulo en grados
    let angle = Math.acos(Math.min(Math.abs(dotProduct) / armMagnitude, 1)) * (180 / Math.PI);
    
    // Ajustar según la posición: 90° = posición inicial, 180° = extensión completa
    if (totalArmVector.y < 0) { // Brazo hacia arriba
      angle = 180 - angle;
    } else { // Brazo hacia abajo o lateral
      angle = Math.max(angle, 90);
    }
    
    return Math.min(Math.max(angle, 60), 180);
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
      pose.leftHip, pose.rightHip,
      pose.nose
    ];
    
    const validKeypoints = requiredKeypoints.filter(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (validKeypoints.length < 7) {
      setFeedback('Ajusta tu posición para que pueda verte mejor');
      setIsCorrectPose(false);
      setStableFrameCount(0);
      return;
    }

    setStableFrameCount(prev => prev + 1);
    
    // Solo analizar después de tener frames estables
    if (stableFrameCount > 3) {
      analyzeShoulderPressForm(pose);
    }
  };

  const analyzeShoulderPressForm = (pose) => {
    // Calcular ángulos de ambos brazos
    const leftArmAngle = calculateShoulderPressAngle(
      pose.leftShoulder,
      pose.leftElbow,
      pose.leftWrist
    );
    
    const rightArmAngle = calculateShoulderPressAngle(
      pose.rightShoulder,
      pose.rightElbow,
      pose.rightWrist
    );

    // Usar el promedio de ambos brazos para el análisis principal
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    
    // Suavizar el ángulo para evitar cambios bruscos
    const smoothedAngle = lastArmAngle * 0.4 + avgArmAngle * 0.6;
    setLastArmAngle(smoothedAngle);
    
    // === LÓGICA DE CONTEO DE REPETICIONES MEJORADA ===
    
    // Estado 1: Posición inicial (brazos a 90° aproximadamente)
    if (!repStarted && smoothedAngle >= 80 && smoothedAngle <= maxStartAngle) {
      setPressPhase('ready');
      setTopPositionReached(false);
    }
    
    // Estado 2: Iniciando press (subiendo desde posición inicial)
    else if (!repStarted && smoothedAngle > maxStartAngle) {
      setRepStarted(true);
      setPressPhase('pressing');
      setTopPositionReached(false);
    }
    
    // Estado 3: Alcanzando extensión completa (brazos arriba)
    else if (repStarted && !topPositionReached && smoothedAngle >= minPressAngle) {
      setTopPositionReached(true);
      setPressPhase('extended');
    }
    
    // Estado 4: Bajando y completando repetición
    else if (repStarted && topPositionReached && smoothedAngle <= maxStartAngle) {
      setRepCount(prev => prev + 1);
      setRepStarted(false);
      setTopPositionReached(false);
      setPressPhase('completed');
      
      // Reset para la siguiente repetición
      setTimeout(() => {
        if (repCount + 1 < totalReps) {
          setPressPhase('ready');
        }
      }, 500);
    }

    // === EVALUACIONES DE FORMA ===
    
    // 1. Sincronización de brazos
    const armSynchronization = Math.abs(leftArmAngle - rightArmAngle);
    const armsSynchronized = armSynchronization < 25;

    // 2. Estabilidad de hombros (mantener nivel)
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersStable = shoulderYDiff < 25;
    
    // 3. Estabilidad del torso
    const hipYDiff = Math.abs(pose.leftHip.y - pose.rightHip.y);
    const torsoStable = hipYDiff < 20;
    
    // 4. Posición de los codos (no demasiado hacia adelante o atrás)
    const leftElbowX = pose.leftElbow.x;
    const leftShoulderX = pose.leftShoulder.x;
    const rightElbowX = pose.rightElbow.x;
    const rightShoulderX = pose.rightShoulder.x;
    
    const leftElbowAlignment = Math.abs(leftElbowX - leftShoulderX) < 50;
    const rightElbowAlignment = Math.abs(rightElbowX - rightShoulderX) < 50;
    const elbowsAligned = leftElbowAlignment && rightElbowAlignment;

    // 5. Posición de la cabeza (no demasiado hacia adelante)
    const headPosition = pose.nose.y < (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    
    // 6. Rango de movimiento apropiado
    const goodRange = smoothedAngle <= 175; // No hiperextender

    // === FEEDBACK INTELIGENTE ===
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};

    // Feedback basado en la fase actual
    if (pressPhase === 'ready') {
      feedbackMessage = 'Posición inicial correcta. ¡Presiona hacia arriba!';
      poseCorrect = true;
    }
    else if (pressPhase === 'pressing') {
      if (smoothedAngle < 130) {
        feedbackMessage = 'Muy bien, sigue presionando hacia arriba';
        poseCorrect = true;
      } else if (smoothedAngle < 150) {
        feedbackMessage = 'Perfecto, casi llegas a la extensión completa';
        poseCorrect = true;
      } else {
        feedbackMessage = 'Excelente, completa la extensión de los brazos';
        poseCorrect = true;
      }
    }
    else if (pressPhase === 'extended') {
      feedbackMessage = '¡Extensión completa! Ahora baja controladamente';
      poseCorrect = true;
    }
    else if (pressPhase === 'completed') {
      feedbackMessage = `¡Repetición ${repCount + 1} completada! Prepárate para la siguiente`;
      poseCorrect = true;
    }

    // Correcciones específicas que tienen prioridad sobre el feedback de fase
    if (!armsSynchronized && repStarted && smoothedAngle > 110) {
      feedbackMessage = 'Presiona ambos brazos al mismo tiempo y velocidad';
      poseCorrect = false;
      currentIssues.armSynchronization += 1;
    }
    else if (!shouldersStable && smoothedAngle > 120) {
      feedbackMessage = 'Mantén los hombros estables y nivelados';
      poseCorrect = false;
      currentIssues.shoulderStability += 1;
    }
    else if (!elbowsAligned && smoothedAngle < 140) {
      feedbackMessage = 'Mantén los codos alineados bajo las muñecas';
      poseCorrect = false;
      currentIssues.elbowPosition += 1;
    }
    else if (!torsoStable && smoothedAngle > 130) {
      feedbackMessage = 'Mantén el core activado, no arquees la espalda';
      poseCorrect = false;
      currentIssues.torsoStability += 1;
    }
    else if (!headPosition && smoothedAngle > 120) {
      feedbackMessage = 'Mantén la cabeza en posición neutral, no la adelantes';
      poseCorrect = false;
      currentIssues.headPosition += 1;
    }
    else if (!goodRange && smoothedAngle > 175) {
      feedbackMessage = 'No hiperextiendas los brazos, detente al estar rectos';
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
    
    let summaryFeedback = '🎉 ¡Excelente trabajo! Has completado las 5 repeticiones de press de hombro.\n\n';
    
    // Consejos específicos basados en los errores más comunes
    if (issues[0][1] > 0) {
      summaryFeedback += '🎯 Áreas de mejora principales:\n\n';
      
      const topIssues = issues.filter(issue => issue[1] > 0).slice(0, 3);
      
      topIssues.forEach((issue, index) => {
        const [issueType, count] = issue;
        
        switch(issueType) {
          case 'shoulderStability':
            summaryFeedback += `• Estabilidad de hombros: Mantén los hombros nivelados y estables durante todo el movimiento. Fortalece los músculos del core.\n\n`;
            break;
          case 'armSynchronization':
            summaryFeedback += `• Sincronización: Presiona ambas mancuernas simultáneamente. Practica con peso ligero para mejorar la coordinación.\n\n`;
            break;
          case 'torsoStability':
            summaryFeedback += `• Estabilidad del torso: Activa el core y evita arquear excesivamente la espalda. Mantén una postura neutra.\n\n`;
            break;
          case 'elbowPosition':
            summaryFeedback += `• Posición de codos: Mantén los codos directamente bajo las muñecas, no los dejes ir hacia adelante o atrás.\n\n`;
            break;
          case 'headPosition':
            summaryFeedback += `• Posición de la cabeza: Mantén el cuello neutro, no adelantes la cabeza durante el press.\n\n`;
            break;
          case 'rangeOfMotion':
            summaryFeedback += `• Control del rango: Extiende completamente pero sin hiperextender los codos en la parte superior.\n\n`;
            break;
        }
      });
    } else {
      summaryFeedback += '🌟 ¡Técnica excelente! Tu forma fue muy buena en todas las repeticiones.\n\n';
    }
    
    // Consejos generales para continuar mejorando
    summaryFeedback += '💡 Consejos para seguir mejorando:\n\n';
    summaryFeedback += '• Respiración: Exhala al presionar hacia arriba, inhala al bajar\n';
    summaryFeedback += '• Velocidad controlada: 2 segundos subir, 1 segundo arriba, 3 segundos bajar\n';
    summaryFeedback += '• Calentamiento: Siempre calienta los hombros antes del press\n';
    summaryFeedback += '• Progresión: Aumenta peso gradualmente solo con técnica perfecta\n';
    summaryFeedback += '• Rango completo: Baja hasta que los codos estén a 90°\n\n';
    
    summaryFeedback += '🏋️‍♀️ ¡Sigue practicando para desarrollar hombros fuertes y definidos!';
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setPressPhase('ready');
    setFeedback('Prepárate para hacer press de hombro');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setLastArmAngle(90);
    setTopPositionReached(false);
    setRepStarted(false);
    setStableFrameCount(0);
    setPosturalIssues({
      armSynchronization: 0,
      shoulderStability: 0,
      torsoStability: 0,
      rangeOfMotion: 0,
      elbowPosition: 0,
      headPosition: 0
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

export default ShoulderPressCorrection;