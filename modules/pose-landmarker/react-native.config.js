// Tells React Native's autolinking about this module's native Android
// package WITHOUT needing to hand-edit the generated MainApplication.kt
// (which lives in the gitignored android/ folder and would be wiped out
// by the next `expo prebuild` anyway). Autolinking reads this file and
// injects `new PoseLandmarkerPackage()` into the generated PackageList
// automatically at build time.
module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.physiqueai.poselandmarker.PoseLandmarkerPackage;',
        packageInstance: 'new PoseLandmarkerPackage()',
      },
    },
  },
};
