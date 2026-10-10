import { useEffect, useState } from 'react';
import { View } from 'react-native';

const LIME = '#E1E100';
const INACTIVE = '#263326';

export function CadeniqueLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 350),
      setTimeout(() => setStep(2), 700),
      setTimeout(() => setStep(3), 1050),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {[1, 2, 3].map((line) => (
        <View
          key={line}
          style={{
            width: 32,
            height: 5,
            borderRadius: 1,
            backgroundColor: step >= line ? LIME : INACTIVE,
          }}
        />
      ))}
    </View>
  );
}
