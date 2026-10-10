import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { OptionList } from '../../components/ui/OptionList';
import { useOnboardingStore, Sex } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

export default function SexStep() {
  const { draft, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={2}
      totalSteps={TOTAL_STEPS}
      title="What's your sex?"
      subtitle="Used for an accurate BMR calculation"
      onContinue={() => router.push('/(onboarding)/height')}
      continueDisabled={!draft.sex}
    >
      <OptionList
        layout="grid"
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
        selected={draft.sex ? [draft.sex] : []}
        onToggle={(value) => setField('sex', value as Sex)}
      />
    </OnboardingStep>
  );
}
