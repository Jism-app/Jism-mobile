import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { OptionList } from '../../components/ui/OptionList';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_STEPS = 9;

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'machines', label: 'Machines' },
  { value: 'cables', label: 'Cables' },
  { value: 'resistance_bands', label: 'Resistance bands' },
  { value: 'pull_up_bar', label: 'Pull-up bar' },
  { value: 'bodyweight_only', label: 'Bodyweight only' },
];

export default function EquipmentStep() {
  const { draft, setField } = useOnboardingStore();
  const selected = draft.equipment;

  const handleToggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    setField('equipment', next);
  };

  return (
    <OnboardingStep
      step={8}
      totalSteps={TOTAL_STEPS}
      title="What equipment do you have?"
      subtitle="Select all that apply — no equipment is fine too"
      onContinue={() => router.push('/(onboarding)/summary')}
      continueDisabled={false}
    >
      <OptionList options={EQUIPMENT_OPTIONS} selected={selected} onToggle={handleToggle} />
    </OnboardingStep>
  );
}
