import { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { WheelPicker } from '../../components/ui/WheelPicker';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

export default function WeightStep() {
  const { draft, setField } = useOnboardingStore();
  const [weight, setWeight] = useState(draft.weight_kg ?? 75);

  const handleContinue = () => {
    setField('weight_kg', weight);
    router.push('/(onboarding)/goal');
  };

  return (
    <OnboardingStep
      step={4}
      totalSteps={TOTAL_STEPS}
      title="What's your current weight?"
      onContinue={handleContinue}
      scrollable={false}
    >
      <WheelPicker min={30} max={200} step={0.5} value={weight} onChange={setWeight} suffix="kg" />
    </OnboardingStep>
  );
}
