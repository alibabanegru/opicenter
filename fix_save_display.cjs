const fs = require('fs');

let file = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix save in Prism Modal
const oldSaveCall = `if (prismTarget === "glassesOrder") {
                        updateOrder(\`\${eyeKey}.prism\`, tempPrismValue);
                        updateOrder(\`\${eyeKey}.base\`, tempPrismBase);
                      }`;

const newSaveCall = `if (prismTarget === "glassesOrder") {
                        updateOrder({
                          [\`\${eyeKey}.prism\`]: tempPrismValue,
                          [\`\${eyeKey}.base\`]: tempPrismBase,
                        });
                      }`;

if (file.includes(oldSaveCall)) {
  file = file.replace(oldSaveCall, newSaveCall);
  console.log("1. Fixed save call in Prism Modal!");
} else {
  console.log("1. oldSaveCall target not found!");
}

// 2. Add prism display under OD eye card in glassesOrder
const odCardEndTarget = `                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-1 px-0.5 shrink-0">`;

const odCardEndReplacement = `                              </div>

                              {currentMedicalRecord.glassesOrder?.od?.prism && (
                                <div className="mt-2 pt-1.5 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between px-0.5">
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Triangle className="w-2.5 h-2.5 fill-current shrink-0" />
                                    Prismă: {currentMedicalRecord.glassesOrder.od.prism} pdpt
                                  </span>
                                  {currentMedicalRecord.glassesOrder.od.base && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                      Baza {currentMedicalRecord.glassesOrder.od.base}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-center gap-1 px-0.5 shrink-0">`;

if (file.includes(odCardEndTarget)) {
  file = file.replace(odCardEndTarget, odCardEndReplacement);
  console.log("2. Added prism display under OD card!");
} else {
  console.log("2. odCardEndTarget not found!");
}

// 3. Add prism display under OS eye card in glassesOrder
const osCardEndTarget = `                              </div>
                            </div>
                          </div>

                          {/* Dioptrii Large Summary */}`;

const osCardEndReplacement = `                              </div>

                              {currentMedicalRecord.glassesOrder?.os?.prism && (
                                <div className="mt-2 pt-1.5 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between px-0.5">
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Triangle className="w-2.5 h-2.5 fill-current shrink-0" />
                                    Prismă: {currentMedicalRecord.glassesOrder.os.prism} pdpt
                                  </span>
                                  {currentMedicalRecord.glassesOrder.os.base && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                      Baza {currentMedicalRecord.glassesOrder.os.base}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dioptrii Large Summary */}`;

if (file.includes(osCardEndTarget)) {
  file = file.replace(osCardEndTarget, osCardEndReplacement);
  console.log("3. Added prism display under OS card!");
} else {
  console.log("3. osCardEndTarget not found!");
}

fs.writeFileSync('src/App.tsx', file, 'utf8');
console.log("Finished script execution.");
