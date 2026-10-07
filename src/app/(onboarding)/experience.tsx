import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { OptionList } from '../../components/ui/OptionList';
import { useOnboardingStore, ExperienceLevel } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

const LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Less than 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training' },
  { value: 'advanced', label: 'Advanced', description: '3+ years, comfortable with programming' },
];

export default function ExperienceStep() {
  const { draft, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={6}
      totalSteps={TOTAL_STEPS}
      title="Training experience"
      onContinue={() => router.push('/(onboarding)/training-days')}
      continueDisabled={!draft.experience_level}
    >
      <OptionList
        options={LEVELS}
        selected={draft.experience_level ? [draft.experience_level] : []}
        onToggle={(value) => setField('experience_level', value as ExperienceLevel)}
      />
    </OnboardingStep>
  );
}
