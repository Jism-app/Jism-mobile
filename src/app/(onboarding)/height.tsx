import { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { WheelPicker } from '../../components/ui/WheelPicker';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

export default function HeightStep() {
  const { draft, setField } = useOnboardingStore();
  const [height, setHeight] = useState(draft.height_cm ?? 175);

  const handleContinue = () => {
    setField('height_cm', height);
    router.push('/(onboarding)/weight');
  };

  return (
    <OnboardingStep
      step={3}
      totalSteps={TOTAL_STEPS}
      title="How tall are you?"
      onContinue={handleContinue}
      scrollable={false}
    >
      <WheelPicker min={120} max={220} value={height} onChange={setHeight} suffix="cm" />
    </OnboardingStep>
  );
}
