console.log("device detection loaded");

// Check if device type is already stored in localStorage
const existingDeviceType = localStorage.getItem("device_type");

if (!existingDeviceType) {
  // Device detection function
  function detectDeviceType() {
    const userAgent = navigator.userAgent;
    
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (!isMobile) {
      return "desktop";
    }
    
    // Check for iOS devices
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return "ios";
    }
    
    // Check for Android devices
    if (/Android/i.test(userAgent)) {
      return "android";
    }
    
    // Default to android for other mobile devices (most common)
    return "android";
  }

  // Detect and store device type only if not already stored
  const deviceType = detectDeviceType();
  localStorage.setItem("device_type", deviceType);

  console.log("Device type detected:", deviceType);
  console.log("Device type stored in localStorage as 'device_type'");
} else {
  console.log("Device type already stored:", existingDeviceType);
} 