const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withFirebaseConfig(config) {
  // Ensure Firebase/Google Services configuration persists through prebuild

  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults;

    // Check if google-services plugin is already declared
    if (
      buildGradle.plugins &&
      !buildGradle.plugins.includes?.("com.google.gms.google-services") &&
      !buildGradle.plugins.some?.(
        (p) => p?.id === "com.google.gms.google-services"
      )
    ) {
      // If plugins array doesn't exist, create it
      if (!buildGradle.plugins) {
        buildGradle.plugins = [];
      }

      // Add google-services plugin
      buildGradle.plugins.push({
        id: "com.google.gms.google-services",
      });
    }

    return config;
  });
};
