import { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { WheelPicker } from '../../components/ui/WheelPicker';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

export default function AgeStep() {
  const { draft, setField } = useOnboardingStore();
  const [age, setAge] = useState(draft.age ?? 25);

  const handleContinue = () => {
    setField('age', age);
    router.push('/(onboarding)/sex');
  };

  return (
    <OnboardingStep
      step={1}
      totalSteps={TOTAL_STEPS}
      title="How old are you?"
      subtitle="This factors into your calorie and macro targets"
      onContinue={handleContinue}
      showBack={false}
      scrollable={false}
    >
      <WheelPicker min={13} max={100} value={age} onChange={setAge} suffix="yrs" />
    </OnboardingStep>
  );
}
