// Definición de tipos para análisis de pose
export interface PoseKeypoint {
    x: number;
    y: number;
    confidence: number;
  }
  
  export interface PoseData {
    pose: {
      leftHip?: PoseKeypoint;
      rightHip?: PoseKeypoint;
      leftKnee?: PoseKeypoint;
      rightKnee?: PoseKeypoint;
      leftAnkle?: PoseKeypoint;
      rightAnkle?: PoseKeypoint;
      leftShoulder?: PoseKeypoint;
      rightShoulder?: PoseKeypoint;
      nose?: PoseKeypoint;
      // Agrega aquí más keypoints si son necesarios para otros ejercicios
    };
  }
  
  // Resultado del análisis de ejercicio
  export interface ExerciseAnalysisResult {
    validPose?: boolean;
    feedback?: string;
    repCompleted?: boolean;
    correctForm?: boolean;
    phase?: string;
    errors?: string[];
  }
  
  // Enumeración para las fases comunes de ejercicio
  export enum ExercisePhase {
    NONE = 'none',
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right',
    FORWARD = 'forward',
    BACKWARD = 'backward',
  }