import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { OptionList } from '../../components/ui/OptionList';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

const DAY_OPTIONS = [2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `${n} days a week`,
}));

export default function TrainingDaysStep() {
  const { draft, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={7}
      totalSteps={TOTAL_STEPS}
      title="How many days can you train?"
      subtitle="Be realistic — consistency matters more than volume"
      onContinue={() => router.push('/(onboarding)/equipment')}
      continueDisabled={!draft.training_days_per_week}
    >
      <OptionList
        options={DAY_OPTIONS}
        selected={draft.training_days_per_week ? [String(draft.training_days_per_week)] : []}
        onToggle={(value) => setField('training_days_per_week', Number(value))}
      />
    </OnboardingStep>
  );
}
