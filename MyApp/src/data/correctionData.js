// Componentes de corrección postural
import SquatCorrection from '../components/poseCorrection/SquatCorrection';
import HeelRaiseCorrection from '../components/poseCorrection/HeelRaiseCorrection';
import ArmCirclesCorrection from '../components/poseCorrection/ArmCirclesCorrection';
import BicepCurlCorrection from '../components/poseCorrection/BicepCurlCorrection';
import LateralRaiseCorrection from '../components/poseCorrection/LateralRaiseCorrection';
import ShoulderPressCorrection from '../components/poseCorrection/ShoulderPressCorrection';
import JumpingJackCorrection from '../components/poseCorrection/JumpingJackCorrection';
import FrontRaiseCorrection from '../components/poseCorrection/FrontRaiseCorrection';
import WallPushUpCorrection from '../components/poseCorrection/WallPushCorrection';


const corrections = {
  squatCorrection: SquatCorrection,
  heelRaiseCorrection: HeelRaiseCorrection,
  armCirclesCorrection: ArmCirclesCorrection,
  bicepCurlCorrection: BicepCurlCorrection,
  lateralRaiseCorrection: LateralRaiseCorrection,
  shoulderPressCorrection: ShoulderPressCorrection,
  jumpingJackCorrection: JumpingJackCorrection,
  frontRaiseCorrection: FrontRaiseCorrection,
  wallPushUpCorrection: WallPushUpCorrection,
};

export default corrections;