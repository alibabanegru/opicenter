const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// 1. Add import for OrdersModal
if (!content.includes('import { OrdersModal }')) {
  content = content.replace(
    'import { WeatherModal } from "./components/WeatherModal";',
    'import { WeatherModal } from "./components/WeatherModal";\nimport { OrdersModal } from "./components/OrdersModal";'
  );
}

// 2. Replace lines for isOrdersModalOpen
const lines = content.split("\n");

let startIdx = -1;
let endIdx = -1;

for (let i = 24000; i < 28000; i++) {
  if (lines[i] && lines[i].includes("<AnimatePresence>") && lines[i+1] && lines[i+1].includes("{isOrdersModalOpen && (") && lines[i+2] && lines[i+2].includes("key=\"orders-modal-overlay\"")) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) {
  for (let i = 24000; i < 28000; i++) {
    if (lines[i] && lines[i].includes("{isOrdersModalOpen && (") && lines[i+1] && lines[i+1].includes("key=\"orders-modal-overlay\"")) {
      startIdx = i - 1; // include <AnimatePresence>
      break;
    }
  }
}

for (let i = startIdx + 100; i < startIdx + 2000; i++) {
  if (lines[i] && lines[i].includes("</AnimatePresence>") && lines[i+2] && lines[i+2].includes("{/* Booking Modal */}")) {
    endIdx = i;
    break;
  }
}

console.log("Start idx:", startIdx + 1, "End idx:", endIdx + 1);

const ordersModalComponentJSX = `        <OrdersModal
          isOpen={isOrdersModalOpen}
          onClose={() => setIsOrdersModalOpen(false)}
          darkMode={darkMode}
          medicalRecords={medicalRecords}
          setMedicalRecords={setMedicalRecords}
          profile={profile}
          isDoctor={isDoctor}
          configs={configs}
          clinicConfig={clinicConfig}
          setPatientName={setPatientName}
          setPatientPhone={setPatientPhone}
          setPatientBirthDate={setPatientBirthDate}
          setFaraTelefon={setFaraTelefon}
          setHasStoredPhone={setHasStoredPhone}
          setPatientSex={setPatientSex}
          setBookingError={setBookingError}
          setIsNewOrderPatientModalOpen={setIsNewOrderPatientModalOpen}
          setCurrentMedicalRecord={setCurrentMedicalRecord}
          setActiveOrderIndex={setActiveOrderIndex}
          setIsGlassesOrderModalOpen={setIsGlassesOrderModalOpen}
          setOrderToDelete={setOrderToDelete}
          setIsOrderDeleteConfirmOpen={setIsOrderDeleteConfirmOpen}
          setIsPermanentDelete={setIsPermanentDelete}
        />`;

lines.splice(startIdx, endIdx - startIdx + 1, ordersModalComponentJSX);

fs.writeFileSync("src/App.tsx", lines.join("\n"));
console.log("Successfully replaced OrdersModal JSX block in App.tsx!");
