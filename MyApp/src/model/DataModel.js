

import exerciseData from '../data/exerciseData'; // Importar datos de ejercicios


const getTypes = () => {
    return [...new Set(exerciseData.map(exercise => exercise.type))];
};

const getEquipment = () => {
    return [...new Set(exerciseData.map(exercise => exercise.equipment))];
};

const getMuscleGroups = () => {
    return [...new Set(exerciseData.map(exercise => exercise.muscleGroup))];
};

export { getTypes, getEquipment, getMuscleGroups };