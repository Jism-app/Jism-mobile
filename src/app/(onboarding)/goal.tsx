import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { OptionList } from '../../components/ui/OptionList';
import { useOnboardingStore, Goal } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'muscle_gain', label: 'Build muscle', description: 'Focus on hypertrophy, calorie surplus' },
  { value: 'fat_loss', label: 'Lose fat', description: 'Preserve muscle in a calorie deficit' },
  { value: 'recomposition', label: 'Recomposition', description: 'Build muscle and lose fat simultaneously' },
  { value: 'general_fitness', label: 'General fitness', description: 'Balanced training, maintenance calories' },
];

export default function GoalStep() {
  const { draft, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={5}
      totalSteps={TOTAL_STEPS}
      title="What's your goal?"
      onContinue={() => router.push('/(onboarding)/experience')}
      continueDisabled={!draft.goal}
    >
      <OptionList
        options={GOALS}
        selected={draft.goal ? [draft.goal] : []}
        onToggle={(value) => setField('goal', value as Goal)}
      />
    </OnboardingStep>
  );
}
